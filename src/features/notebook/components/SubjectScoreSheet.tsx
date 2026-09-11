import { Fragment, useMemo, useState } from "react"
import { Link } from "@tanstack/react-router"
import { AlertTriangleIcon, Loader2Icon, BrainCircuitIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TrimesterSelect } from "@/components/shared/TrimesterSelect"
import { useCourseStudents } from "@/features/courses/hooks/useCourses"
import type { ClassGroupItem } from "@/features/courses/types/course"
import { isTechnicalSubject } from "@/features/courses/types/course"
import {
  useClassGroupRisk,
  usePredictClassGroupRisk,
} from "@/features/risk/hooks/useRisk"
import { RiskProbability } from "@/features/risk/components/RiskProbability"

import {
  DIMENSIONS,
  dimensionMeta,
  type AssessmentEvent,
  type Criterion,
  type Dimension,
} from "@/features/assessment/types"
import {
  useCriteria,
  useCriteriaEvents,
  useCriteriaScores,
  useDeleteScore,
  useEventScores,
  useSetScore,
} from "@/features/assessment/hooks/useAssessment"
import { cellTitle, round1 } from "@/features/assessment/utils/scoreCell"
import {
  draftText,
  mean,
  scoreFromText,
} from "@/features/assessment/utils/scoreDraft"
import { CriteriaManager } from "@/features/assessment/components/CriteriaManager"
import type { Trimester } from "@/features/notebook/types"

export interface SubjectScoreSheetProps {
  classGroup: ClassGroupItem
  /** true = el docente de aula viendo una materia técnica: sin editar/borrar. */
  readOnly?: boolean
}

/**
 * Una columna por criterio, no por item: es la unidad que el backend promedia.
 * `events` vacío = criterio directo, la nota se escribe aquí. Con ítems, la nota del
 * criterio es el promedio de ellos y esta celda es de solo lectura.
 */
interface Column {
  dimKey: Dimension
  criterion: Criterion
  events: AssessmentEvent[]
}

/**
 * Encabezado rotado: `vertical-rl` gira el texto, y el `rotate-180` lo deja leyéndose de
 * abajo hacia arriba (sin él, queda cabeza abajo). Los nombres de criterio son largos y
 * como columna horizontal se cortaban; así entran enteros y la columna baja a 2.5rem.
 */
const VERTICAL_HEAD =
  "[writing-mode:vertical-rl] rotate-180 whitespace-nowrap min-h-40 mx-auto"

export function SubjectScoreSheet({
  classGroup,
  readOnly = false,
}: SubjectScoreSheetProps) {
  const [trimester, setTrimester] = useState<Trimester>(1)
  // Solo lo TECLEADO, no un espejo del servidor: una casilla sin tocar no tiene entrada
  // acá y se dibuja leyendo directamente la nota. Así un refetch no puede pisar lo que
  // el docente está escribiendo, y no hace falta sincronizar nada en un efecto.
  const [draft, setDraft] = useState<Record<string, string>>({})

  // El riesgo vive en su propio panel; acá va sólo la columna, al lado de la nota que la explica.
  const riskQuery = useClassGroupRisk(classGroup.id, trimester)
  const predictRisk = usePredictClassGroupRisk()
  const predictionsLoading = riskQuery.isLoading
  // Por estudiante: la tabla busca treinta veces, y un find lineal por fila sería cuadrático.
  const riskByStudent = useMemo(
    () => new Map((riskQuery.data ?? []).map((r) => [r.studentId, r])),
    [riskQuery.data]
  )

  const criteriaQuery = useCriteria(classGroup.id, trimester)
  const critLoading = criteriaQuery.isLoading
  // Ref estable: sin esto columns/eventIds/directIds se recrean en cada render y las
  // queries por id se vuelven a disparar.
  const criteria = useMemo(() => criteriaQuery.data ?? [], [criteriaQuery.data])
  const { byCriterion, isLoading: evLoading } = useCriteriaEvents(criteria)

  const studentsQuery = useCourseStudents(classGroup.courseId, {
    offset: 1,
    limit: 200,
    sort: "asc",
  })
  const students = useMemo(
    () => studentsQuery.data?.content ?? [],
    [studentsQuery.data]
  )

  // Columnas planas en orden dimensión→criterio. Todo criterio da una columna, tenga
  // ítems o no: lo que se califica es el criterio.
  const columns = useMemo(() => {
    const cols: Column[] = []
    for (const dim of DIMENSIONS) {
      for (const c of criteria.filter((x) => x.dimension === dim.key)) {
        cols.push({
          dimKey: dim.key,
          criterion: c,
          events: byCriterion[c.id] ?? [],
        })
      }
    }
    return cols
  }, [criteria, byCriterion])

  // Los ítems alimentan el promedio de su criterio; los criterios sin ítems reciben
  // la nota directa. Cada lote va a su propio endpoint.
  //
  // Nada arranca hasta que los ítems cargan: mientras `byCriterion` está vacío TODO
  // criterio parece directo, y esa lectura no es solo un promedio transitorio mal
  // calculado — deja la casilla editable sobre un criterio de actividad y una nota
  // tecleada ahí se guardaría como nota DIRECTA de un criterio que se califica por
  // sus ítems. Es la misma guarda que aplica CriterionScoreSheet.
  const eventIds = useMemo(
    () => (evLoading ? [] : columns.flatMap((c) => c.events.map((e) => e.id))),
    [evLoading, columns]
  )
  const directIds = useMemo(
    () =>
      evLoading
        ? []
        : columns
            .filter((c) => c.events.length === 0)
            .map((c) => c.criterion.id),
    [evLoading, columns]
  )
  const { matrix, isLoading: eventScoresLoading } = useEventScores(eventIds)
  const { matrix: directMatrix, isLoading: directScoresLoading } =
    useCriteriaScores(directIds)
  // Sin esto la casilla cargando y la no calificada dibujan el mismo "—", y la casilla
  // queda escribible antes de saber si el criterio se califica directo o por ítems.
  const scoresLoading = evLoading || eventScoresLoading || directScoresLoading
  const setScore = useSetScore()
  const deleteScore = useDeleteScore()

  /** Nota del criterio: la directa, o el promedio de sus ítems. null si no hay ninguna. */
  const valueOf = (col: Column, ce: string): number | null => {
    if (col.events.length === 0) {
      const cell = directMatrix[col.criterion.id]?.[ce]
      return cell ? cell.score : null
    }
    return mean(
      col.events
        .map((e) => matrix[e.id]?.[ce]?.score)
        .filter((n): n is number => n !== undefined)
    )
  }

  /** Lo tecleado si la casilla se tocó; si no, la nota guardada. "" = no calificado. */
  const directText = (col: Column, ce: string): string =>
    draftText(
      draft,
      `${ce}:${col.criterion.id}`,
      directMatrix[col.criterion.id]?.[ce]?.score
    )

  const commit = (ce: string, col: Column, raw: string) => {
    const key = `${ce}:${col.criterion.id}`
    const existing = directMatrix[col.criterion.id]?.[ce]
    const trimmed = raw.trim()

    // Vacío = no calificado: borra la nota si existía.
    if (trimmed === "") {
      setDraft((d) => ({ ...d, [key]: "" }))
      if (existing) {
        deleteScore.mutate({ id: existing.id, criterionId: col.criterion.id })
      }
      return
    }

    const val = scoreFromText(trimmed, dimensionMeta(col.dimKey).weight)
    if (val === null) {
      // Texto inválido: no persiste; deja que la casilla vuelva a la nota guardada.
      // Guardar un 0 por un tecleo mal escrito sería peor que descartarlo.
      setDraft((d) => {
        const next = { ...d }
        delete next[key]
        return next
      })
      return
    }

    // El borrador queda con el valor YA acotado, que es el que el backend va a devolver:
    // sin esto la casilla seguiría mostrando el "999" que el docente tecleó.
    setDraft((d) => ({ ...d, [key]: String(val) }))

    if (existing && existing.score === val) return
    setScore.mutate({
      id_course_enrollment: ce,
      id_criterion: col.criterion.id,
      score: val,
    })
  }

  /**
   * Promedio de la dimensión = media de las notas de sus CRITERIOS, no de las casillas
   * sueltas. Es la misma cuenta de dos niveles que hace el backend: si se promediaran
   * los ítems crudos, un criterio con diez ítems pesaría diez veces más que uno directo.
   */
  const dimensionAverage = (ce: string, dimKey: Dimension): number | null => {
    const max = dimensionMeta(dimKey).weight
    const values: number[] = []
    for (const col of columns) {
      if (col.dimKey !== dimKey) continue
      // El criterio directo sigue al tecleo, no al último refetch, y ya viene acotado:
      // sin el tope, un 999 sin confirmar inflaba el promedio y el total de la fila.
      const v =
        col.events.length === 0
          ? scoreFromText(directText(col, ce), max)
          : valueOf(col, ce)
      if (v !== null) values.push(v)
    }
    return mean(values)
  }

  /** Total = suma de los 4 promedios de dimensión. */
  const totalOf = (ce: string): number =>
    DIMENSIONS.reduce((acc, d) => acc + (dimensionAverage(ce, d.key) ?? 0), 0)

  const visibleDims = DIMENSIONS.filter((d) =>
    columns.some((c) => c.dimKey === d.key)
  )
  // Las tres fijas son Estudiante, el promedio trimestral y el riesgo; cada dimensión visible
  // suma su propia columna de promedio además de sus criterios. Si se agrega o saca una columna
  // fija hay que tocar esto, o la fila de "sin estudiantes" deja de cubrir la tabla.
  const bodyColSpan = columns.length + visibleDims.length + 3

  const hasCriteria = criteria.length > 0
  const technical = isTechnicalSubject(classGroup.subjectName)

  return (
    <div className="flex min-w-0 flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          {classGroup.subjectName}
          {technical ? (
            <span className="rounded bg-amber-500/15 px-2 py-0.5 text-xs font-medium text-amber-700 dark:text-amber-300">
              Técnica
            </span>
          ) : null}
          {readOnly ? (
            <span className="rounded bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
              Solo lectura
            </span>
          ) : null}
        </h2>
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            disabled={
              predictRisk.isPending || hasCriteria === false || readOnly
            }
            onClick={() =>
              predictRisk.mutate({ classGroupId: classGroup.id, trimester })
            }
          >
            {predictRisk.isPending ? (
              <Loader2Icon className="size-4 animate-spin" />
            ) : (
              <BrainCircuitIcon className="size-4 text-primary" />
            )}
            Predecir Riesgo
          </Button>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Trimestre</span>
            <TrimesterSelect
              value={trimester}
              onChange={(t) => setTrimester(t as Trimester)}
            />
          </div>
        </div>
      </div>

      <Tabs defaultValue="notas">
        <TabsList>
          <TabsTrigger value="notas">Notas</TabsTrigger>
          <TabsTrigger value="criterios">Criterios</TabsTrigger>
        </TabsList>

        <TabsContent value="notas" className="pt-4">
          {critLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2Icon className="size-4 animate-spin" /> Cargando…
            </div>
          ) : !hasCriteria ? (
            <div className="flex flex-col items-center gap-2 rounded-md border border-dashed border-amber-500/40 bg-amber-500/5 p-8 text-center text-sm">
              <AlertTriangleIcon className="size-6 text-amber-600" />
              <p className="font-medium">
                Define criterios antes de cargar notas.
              </p>
              <p className="text-muted-foreground">
                Ve a la pestaña <strong>Criterios</strong> y agrega al menos un
                criterio para este trimestre.
              </p>
            </div>
          ) : (
            <div className="min-w-0 overflow-hidden rounded-md border bg-card">
              <ScrollArea className="w-full whitespace-nowrap">
                <table className="w-max border-collapse text-sm">
                  <thead>
                    <tr>
                      <th
                        rowSpan={2}
                        className="sticky left-0 z-20 min-w-[16rem] border-r border-b bg-muted px-3 py-2 text-left align-bottom font-medium shadow-[2px_0_0_0_var(--border)]"
                      >
                        Estudiante
                      </th>
                      {visibleDims.map((dim) => {
                        const count = columns.filter(
                          (c) => c.dimKey === dim.key
                        ).length
                        return (
                          <th
                            key={dim.key}
                            colSpan={count + 1}
                            className={cn(
                              "border-r border-b px-2 py-1.5 text-center font-semibold",
                              dim.color.soft
                            )}
                          >
                            {dim.label}{" "}
                            <span className="text-xs font-normal text-muted-foreground">
                              /{dim.weight}
                            </span>
                          </th>
                        )
                      })}
                      <th
                        rowSpan={2}
                        className="w-10 border-b bg-muted p-1 align-bottom font-semibold"
                      >
                        <div className={VERTICAL_HEAD}>
                          PROMEDIO TRIMESTRAL · /100
                        </div>
                      </th>
                      <th
                        rowSpan={2}
                        className="w-10 border-b border-l bg-rose-500/10 p-1 align-bottom font-semibold text-rose-700 dark:text-rose-400"
                        title="Probabilidad de reprobar la materia al finalizar el año"
                      >
                        <div className={VERTICAL_HEAD}>
                          RIESGO (PROB. REPRUEBA)
                        </div>
                      </th>
                    </tr>
                    <tr>
                      {visibleDims.map((dim) => (
                        <Fragment key={dim.key}>
                          {columns
                            .filter((c) => c.dimKey === dim.key)
                            .map((col) => (
                              <th
                                key={col.criterion.id}
                                title={
                                  col.events.length > 0
                                    ? `${col.criterion.name} · promedio de ${col.events.length} ${
                                        col.events.length === 1
                                          ? "criterio"
                                          : "criterios"
                                      } de la actividad${
                                        col.criterion.activityName
                                          ? ` "${col.criterion.activityName}"`
                                          : ""
                                      }`
                                    : `${col.criterion.name} · calificación directa`
                                }
                                className="w-10 border-r border-b bg-muted/40 p-1 align-bottom text-xs font-normal"
                              >
                                <div
                                  className={cn(
                                    "flex items-center gap-1",
                                    VERTICAL_HEAD
                                  )}
                                >
                                  <span>{col.criterion.name}</span>
                                  <span className="text-[10px] text-muted-foreground">
                                    {col.events.length > 0
                                      ? "prom. actividad"
                                      : `/${dim.weight}`}
                                  </span>
                                </div>
                              </th>
                            ))}
                          <th
                            className={cn(
                              "w-10 border-r border-b p-1 align-bottom text-xs font-semibold",
                              dim.color.soft
                            )}
                          >
                            <div className={VERTICAL_HEAD}>
                              PROMEDIO {dim.label} · /{dim.weight}
                            </div>
                          </th>
                        </Fragment>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {studentsQuery.isLoading ? (
                      <tr>
                        <td
                          colSpan={bodyColSpan}
                          className="px-3 py-6 text-center text-muted-foreground"
                        >
                          <Loader2Icon className="mx-auto size-4 animate-spin" />
                        </td>
                      </tr>
                    ) : students.length === 0 ? (
                      <tr>
                        <td
                          colSpan={bodyColSpan}
                          className="px-3 py-6 text-center text-muted-foreground"
                        >
                          Sin estudiantes en el curso.
                        </td>
                      </tr>
                    ) : (
                      students.map((s, idx) => {
                        const ce = s.courseEnrollmentId
                        const rowBg = idx % 2 === 0 ? "bg-card" : "bg-muted"
                        return (
                          <tr key={ce} className="border-t">
                            <td
                              className={cn(
                                "sticky left-0 z-10 min-w-[16rem] border-r px-3 py-2 font-medium shadow-[2px_0_0_0_var(--border)]",
                                rowBg
                              )}
                            >
                              {s.fullName}
                            </td>
                            {visibleDims.map((dim) => {
                              const avg = dimensionAverage(ce, dim.key)
                              return (
                                <Fragment key={dim.key}>
                                  {columns
                                    .filter((c) => c.dimKey === dim.key)
                                    .map((col) => {
                                      const k = `${ce}:${col.criterion.id}`
                                      const cell =
                                        directMatrix[col.criterion.id]?.[ce]
                                      // Con ítems la nota no se escribe aquí: es el promedio
                                      // de la grilla de la actividad, y se entra a esa grilla.
                                      const activityAvg =
                                        col.events.length > 0
                                          ? valueOf(col, ce)
                                          : null
                                      return (
                                        <td
                                          key={col.criterion.id}
                                          className={cn(
                                            "border-r px-1 py-1 text-center",
                                            rowBg
                                          )}
                                        >
                                          {col.events.length > 0 ? (
                                            <Link
                                              to="/scores/$classGroupId/criterio/$criterionId"
                                              params={{
                                                classGroupId: classGroup.id,
                                                criterionId: col.criterion.id,
                                              }}
                                              // La grilla del criterio carga los criterios
                                              // de su trimestre: sin esto cae al 1 y no lo halla.
                                              search={{ trimester }}
                                              title={`Calificar los criterios de "${
                                                col.criterion.activityName ??
                                                col.criterion.name
                                              }"`}
                                              className="inline-block w-16 py-1 font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                                            >
                                              {scoresLoading &&
                                              activityAvg === null
                                                ? "…"
                                                : activityAvg === null
                                                  ? "—"
                                                  : round1(activityAvg)}
                                            </Link>
                                          ) : readOnly ? (
                                            <span
                                              title={cellTitle(cell)}
                                              className="inline-block w-16 py-1"
                                            >
                                              {directText(col, ce) ||
                                                (scoresLoading ? "…" : "—")}
                                            </span>
                                          ) : (
                                            <Input
                                              type="number"
                                              inputMode="decimal"
                                              min={0}
                                              max={dim.weight}
                                              step={0.5}
                                              title={cellTitle(cell)}
                                              value={directText(col, ce)}
                                              disabled={scoresLoading}
                                              placeholder={
                                                scoresLoading ? "…" : undefined
                                              }
                                              onChange={(e) =>
                                                setDraft((d) => ({
                                                  ...d,
                                                  [k]: e.target.value,
                                                }))
                                              }
                                              onBlur={(e) =>
                                                commit(ce, col, e.target.value)
                                              }
                                              className="h-9 w-16 text-center"
                                            />
                                          )}
                                        </td>
                                      )
                                    })}
                                  <td
                                    className={cn(
                                      "border-r px-2 py-1 text-center font-medium text-muted-foreground",
                                      rowBg
                                    )}
                                  >
                                    {avg === null ? "—" : round1(avg)}
                                  </td>
                                </Fragment>
                              )
                            })}
                            <td
                              className={cn(
                                "border-r px-2 py-1 text-center font-semibold",
                                rowBg
                              )}
                            >
                              {round1(totalOf(ce))}
                            </td>
                            <td
                              className={cn(
                                "border-l px-2 py-1 text-center font-medium",
                                rowBg
                              )}
                            >
                              <RiskProbability
                                risk={riskByStudent.get(s.studentId)}
                                isLoading={predictionsLoading}
                              />
                            </td>
                          </tr>
                        )
                      })
                    )}
                  </tbody>
                </table>
                <ScrollBar orientation="horizontal" />
              </ScrollArea>
            </div>
          )}
          <p className="pt-2 text-xs text-muted-foreground">
            {readOnly
              ? "Materia técnica: las notas las registra el docente técnico. Aquí solo se visualizan."
              : "Hay una columna por criterio. El criterio de calificación directa se escribe aquí y se guarda al salir del campo; dejarlo vacío lo marca como no calificado (distinto de 0). El criterio que viene de una actividad muestra el promedio de sus criterios: haz clic para calificarlos. Promedios y total son de solo lectura."}
          </p>
        </TabsContent>

        <TabsContent value="criterios" className="pt-4">
          <CriteriaManager
            classGroupId={classGroup.id}
            trimester={trimester}
            readOnly={readOnly}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
