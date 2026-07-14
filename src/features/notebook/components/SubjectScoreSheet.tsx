import { Fragment, useEffect, useMemo, useState } from "react"
import { AlertTriangleIcon, Loader2Icon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useCourseStudents } from "@/features/courses/hooks/useCourses"
import type { ClassGroupItem } from "@/features/courses/types/course"
import { isTechnicalSubject } from "@/features/courses/types/course"

import {
  DIMENSIONS,
  dimensionMeta,
  type AssessmentEvent,
  type Criterion,
} from "@/features/assessment/types"
import {
  useCriteria,
  useCriteriaEvents,
  useDeleteScore,
  useEventScores,
  useSetScore,
  type ScoreCell,
} from "@/features/assessment/hooks/useAssessment"
import { CriteriaManager } from "@/features/assessment/components/CriteriaManager"

export interface SubjectScoreSheetProps {
  classGroup: ClassGroupItem
}

type Trimester = 1 | 2 | 3
type Column = { dimKey: string; criterion: Criterion; event: AssessmentEvent }

const round1 = (n: number) => Math.round(n * 10) / 10

const formatDate = (iso?: string | null): string | null => {
  if (!iso) return null
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? null : d.toLocaleDateString("es-BO")
}

/** Tooltip de la casilla: fecha de registro (y edicion si difiere). */
const cellTitle = (cell: ScoreCell | undefined): string | undefined => {
  if (!cell) return undefined
  const recorded = formatDate(cell.recordedAt)
  const updated = formatDate(cell.updatedAt)
  if (!recorded && !updated) return undefined
  const parts: string[] = []
  if (recorded) parts.push(`registrada ${recorded}`)
  if (updated && updated !== recorded) parts.push(`editada ${updated}`)
  return parts.join(" · ")
}

export function SubjectScoreSheet({ classGroup }: SubjectScoreSheetProps) {
  const [trimester, setTrimester] = useState<Trimester>(1)
  // Texto crudo por casilla: "" = no calificado (distinto de "0").
  const [draft, setDraft] = useState<Record<string, string>>({})

  const { data: criteria = [], isLoading: critLoading } = useCriteria(
    classGroup.id,
    trimester,
  )
  const { byCriterion } = useCriteriaEvents(criteria)

  const studentsQuery = useCourseStudents(classGroup.courseId, {
    offset: 1,
    limit: 200,
    sort: "asc",
  })
  const students = useMemo(
    () => studentsQuery.data?.content ?? [],
    [studentsQuery.data],
  )

  // Columnas planas en orden dimension→criterio→actividad.
  const columns = useMemo(() => {
    const cols: Column[] = []
    for (const dim of DIMENSIONS) {
      for (const c of criteria.filter((x) => x.dimension === dim.key)) {
        for (const e of byCriterion[c.id] ?? []) {
          cols.push({ dimKey: dim.key, criterion: c, event: e })
        }
      }
    }
    return cols
  }, [criteria, byCriterion])

  const eventIds = useMemo(() => columns.map((c) => c.event.id), [columns])
  const { matrix } = useEventScores(eventIds)
  const setScore = useSetScore()
  const deleteScore = useDeleteScore()

  useEffect(() => {
    const next: Record<string, string> = {}
    for (const s of students) {
      for (const col of columns) {
        const cell = matrix[col.event.id]?.[s.courseEnrollmentId]
        if (cell) next[`${s.courseEnrollmentId}:${col.event.id}`] = String(cell.score)
      }
    }
    setDraft(next)
  }, [students, columns, matrix])

  const commit = (ce: string, col: Column, raw: string) => {
    const existing = matrix[col.event.id]?.[ce]
    const trimmed = raw.trim()

    // Vacio = no calificado: borra la nota si existia.
    if (trimmed === "") {
      if (existing) deleteScore.mutate({ id: existing.id, eventId: col.event.id })
      return
    }

    const max = dimensionMeta(col.dimKey).weight
    let val = Number(trimmed)
    if (!Number.isFinite(val) || val < 0) val = 0
    if (val > max) val = max

    if (existing && existing.score === val) return
    setScore.mutate({
      id_course_enrollment: ce,
      id_assessment_event: col.event.id,
      score: val,
    })
  }

  /** Promedio de la dimension = media de las casillas con valor. null si ninguna. */
  const dimensionAverage = (ce: string, dimKey: string): number | null => {
    const values: number[] = []
    for (const col of columns) {
      if (col.dimKey !== dimKey) continue
      const raw = draft[`${ce}:${col.event.id}`]
      if (raw === undefined || raw.trim() === "") continue
      const n = Number(raw)
      if (Number.isFinite(n)) values.push(n)
    }
    if (values.length === 0) return null
    return values.reduce((a, b) => a + b, 0) / values.length
  }

  /** Total = suma de los 4 promedios de dimension. */
  const totalOf = (ce: string): number =>
    DIMENSIONS.reduce((acc, d) => acc + (dimensionAverage(ce, d.key) ?? 0), 0)

  const visibleDims = DIMENSIONS.filter((d) =>
    columns.some((c) => c.dimKey === d.key),
  )
  const bodyColSpan = columns.length + visibleDims.length + 2

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
        </h2>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Trimestre</span>
          <Select value={String(trimester)} onValueChange={(v) => setTrimester(Number(v) as Trimester)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">1ro</SelectItem>
              <SelectItem value="2">2do</SelectItem>
              <SelectItem value="3">3ro</SelectItem>
            </SelectContent>
          </Select>
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
              <p className="font-medium">Define criterios antes de cargar notas.</p>
              <p className="text-muted-foreground">
                Ve a la pestaña <strong>Criterios</strong> y agrega al menos un
                criterio con su actividad para este trimestre.
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
                        const count = columns.filter((c) => c.dimKey === dim.key).length
                        return (
                          <th
                            key={dim.key}
                            colSpan={count + 1}
                            className="border-r border-b bg-muted/60 px-2 py-1.5 text-center font-semibold"
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
                        className="border-b bg-muted px-2 py-2 text-center align-bottom font-semibold"
                      >
                        Total
                        <div className="text-[10px] font-normal text-muted-foreground">/100</div>
                      </th>
                    </tr>
                    <tr>
                      {visibleDims.map((dim) => (
                        <Fragment key={dim.key}>
                          {columns
                            .filter((c) => c.dimKey === dim.key)
                            .map((col) => (
                              <th
                                key={col.event.id}
                                title={`${col.criterion.name} · ${col.event.title}`}
                                className="min-w-24 border-r border-b bg-muted/40 px-2 py-1 text-center text-xs font-normal"
                              >
                                <div className="truncate">{col.event.title}</div>
                                <div className="text-[10px] text-muted-foreground">
                                  /{dim.weight}
                                </div>
                              </th>
                            ))}
                          <th className="min-w-20 border-r border-b bg-muted/70 px-2 py-1 text-center text-xs font-semibold">
                            Prom.
                          </th>
                        </Fragment>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {studentsQuery.isLoading ? (
                      <tr>
                        <td colSpan={bodyColSpan} className="px-3 py-6 text-center text-muted-foreground">
                          <Loader2Icon className="mx-auto size-4 animate-spin" />
                        </td>
                      </tr>
                    ) : students.length === 0 ? (
                      <tr>
                        <td colSpan={bodyColSpan} className="px-3 py-6 text-center text-muted-foreground">
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
                                rowBg,
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
                                      const k = `${ce}:${col.event.id}`
                                      const cell = matrix[col.event.id]?.[ce]
                                      return (
                                        <td
                                          key={col.event.id}
                                          className={cn("border-r px-1 py-1 text-center", rowBg)}
                                        >
                                          <Input
                                            type="number"
                                            inputMode="decimal"
                                            min={0}
                                            max={dim.weight}
                                            step={0.5}
                                            title={cellTitle(cell)}
                                            value={draft[k] ?? ""}
                                            onChange={(e) =>
                                              setDraft((d) => ({ ...d, [k]: e.target.value }))
                                            }
                                            onBlur={(e) => commit(ce, col, e.target.value)}
                                            className="h-9 w-16 text-center"
                                          />
                                        </td>
                                      )
                                    })}
                                  <td
                                    className={cn(
                                      "border-r px-2 py-1 text-center font-medium text-muted-foreground",
                                      rowBg,
                                    )}
                                  >
                                    {avg === null ? "—" : round1(avg)}
                                  </td>
                                </Fragment>
                              )
                            })}
                            <td className={cn("px-2 py-1 text-center font-semibold", rowBg)}>
                              {round1(totalOf(ce))}
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
            La nota se guarda al salir del campo; cada casilla admite hasta el tope de
            su dimension. Dejar la casilla <strong>vacía</strong> marca la actividad como
            no calificada (distinto de 0). Promedios y total son de solo lectura.
          </p>
        </TabsContent>

        <TabsContent value="criterios" className="pt-4">
          <CriteriaManager classGroupId={classGroup.id} trimester={trimester} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
