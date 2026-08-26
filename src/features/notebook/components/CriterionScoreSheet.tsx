import { useEffect, useMemo, useState } from "react"
import { Link } from "@tanstack/react-router"
import { ArrowLeftIcon, Loader2Icon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { useCourseStudents } from "@/features/courses/hooks/useCourses"
import type { ClassGroupItem } from "@/features/courses/types/course"

import { dimensionMeta, type Criterion } from "@/features/assessment/types"
import {
  useCriteriaEvents,
  useCriterionScores,
  useDeleteScore,
  useEventScores,
  useSetScore,
  type ScoreCell,
} from "@/features/assessment/hooks/useAssessment"

export interface CriterionScoreSheetProps {
  classGroup: ClassGroupItem
  criterion: Criterion
}

/**
 * Una columna calificable. El criterio con actividad tiene una por item; el criterio
 * directo tiene una sola, que es el criterio mismo.
 */
type ScoreColumn =
  | { kind: "event"; id: string; title: string }
  | { kind: "criterion"; id: string; title: string }

const round1 = (n: number) => Math.round(n * 10) / 10

const formatDate = (iso: string | null): string | null => {
  if (!iso) return null
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? null : d.toLocaleDateString("es-BO")
}

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

/** Grilla de notas de un criterio: columnas = items de su actividad, o el criterio solo. */
export function CriterionScoreSheet({ classGroup, criterion }: CriterionScoreSheetProps) {
  const meta = dimensionMeta(criterion.dimension)
  const cap = meta.weight

  // Ref estable del criterio para no recrear la cadena de memos cada render.
  const criteriaArr = useMemo(() => [criterion], [criterion])
  const { byCriterion, isLoading: evLoading } = useCriteriaEvents(criteriaArr)
  const events = useMemo(
    () => byCriterion[criterion.id] ?? [],
    [byCriterion, criterion.id],
  )

  /**
   * Tener items es lo que descalifica la nota directa, no el nombre de la actividad:
   * los criterios creados antes de que existiera `activityName` lo traen en null y aun
   * asi se califican por sus items. Es la misma regla que aplica el backend.
   */
  const activityBased = criterion.activityName !== null || events.length > 0

  const studentsQuery = useCourseStudents(classGroup.courseId, {
    offset: 1,
    limit: 200,
    sort: "asc",
  })
  const students = useMemo(
    () => studentsQuery.data?.content ?? [],
    [studentsQuery.data],
  )

  const eventIds = useMemo(
    () => (activityBased ? events.map((e) => e.id) : []),
    [activityBased, events],
  )
  const { matrix } = useEventScores(eventIds)
  const { byEnrollment } = useCriterionScores(activityBased ? null : criterion.id)

  const setScore = useSetScore()
  const deleteScore = useDeleteScore()

  const columns = useMemo<ScoreColumn[]>(
    () =>
      activityBased
        ? events.map((e) => ({ kind: "event" as const, id: e.id, title: e.title }))
        : [{ kind: "criterion" as const, id: criterion.id, title: criterion.name }],
    [activityBased, events, criterion.id, criterion.name],
  )

  const cellOf = (col: ScoreColumn, ce: string): ScoreCell | undefined =>
    col.kind === "event" ? matrix[col.id]?.[ce] : byEnrollment[ce]

  // Texto crudo por casilla: "" = no calificado (distinto de "0").
  const [draft, setDraft] = useState<Record<string, string>>({})
  useEffect(() => {
    const next: Record<string, string> = {}
    for (const s of students) {
      for (const col of columns) {
        const cell =
          col.kind === "event"
            ? matrix[col.id]?.[s.courseEnrollmentId]
            : byEnrollment[s.courseEnrollmentId]
        if (cell) next[`${s.courseEnrollmentId}:${col.id}`] = String(cell.score)
      }
    }
    // Merge sobre lo tecleado: un refetch (guardar otra casilla) no borra lo no confirmado.
    setDraft((prev) => ({ ...prev, ...next }))
  }, [students, columns, matrix, byEnrollment])

  const commit = (ce: string, col: ScoreColumn, raw: string) => {
    const existing = cellOf(col, ce)
    const trimmed = raw.trim()
    if (trimmed === "") {
      if (existing) {
        deleteScore.mutate({
          id: existing.id,
          eventId: col.kind === "event" ? col.id : null,
          criterionId: col.kind === "criterion" ? col.id : null,
        })
      }
      return
    }
    let val = Number(trimmed)
    if (!Number.isFinite(val)) {
      // Texto inválido: no persiste; restaura el valor previo en la casilla.
      setDraft((d) => ({
        ...d,
        [`${ce}:${col.id}`]: existing ? String(existing.score) : "",
      }))
      return
    }
    if (val < 0) val = 0
    if (val > cap) val = cap
    if (existing && existing.score === val) return
    // Exactamente un destino: el backend rechaza un cuerpo que traiga los dos.
    setScore.mutate(
      col.kind === "event"
        ? { id_course_enrollment: ce, id_assessment_event: col.id, score: val }
        : { id_course_enrollment: ce, id_criterion: col.id, score: val },
    )
  }

  /** Promedio del criterio = media de sus casillas con valor. null si ninguna. */
  const rowAverage = (ce: string): number | null => {
    const values: number[] = []
    for (const col of columns) {
      const raw = draft[`${ce}:${col.id}`]
      if (raw === undefined || raw.trim() === "") continue
      let n = Number(raw)
      if (!Number.isFinite(n)) continue
      // Mismo clamp que commit: el promedio no infla por texto sin confirmar.
      if (n < 0) n = 0
      if (n > cap) n = cap
      values.push(n)
    }
    if (values.length === 0) return null
    return values.reduce((a, b) => a + b, 0) / values.length
  }

  // El criterio directo no promedia nada: su unica casilla ES la nota del criterio.
  const showAverage = activityBased
  const colSpan = columns.length + (showAverage ? 2 : 1)

  const emptyActivity = activityBased && events.length === 0

  return (
    <div className="flex min-w-0 flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <Link
          to="/scores/$classGroupId"
          params={{ classGroupId: classGroup.id }}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeftIcon className="size-4" /> Volver
        </Link>
        <h2 className="text-lg font-semibold">
          {meta.label} — {criterion.name}
          <span className="ml-2 text-sm font-normal text-muted-foreground">
            {classGroup.subjectName} · nota máx {cap}
          </span>
        </h2>
        {criterion.activityName ? (
          <Badge variant="outline">Actividad: {criterion.activityName}</Badge>
        ) : (
          <Badge variant="secondary">Calificación directa</Badge>
        )}
      </div>

      {evLoading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2Icon className="size-4 animate-spin" /> Cargando…
        </div>
      ) : emptyActivity ? (
        <div className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
          Esta actividad aún no tiene criterios. Agrégalos en la pestaña Criterios.
        </div>
      ) : (
        <div className="min-w-0 overflow-hidden rounded-md border bg-card">
          <ScrollArea className="w-full whitespace-nowrap">
            <table className="w-max border-collapse text-sm">
              <thead>
                <tr>
                  <th className="sticky left-0 z-20 min-w-[16rem] border-r border-b bg-muted px-3 py-2 text-left font-medium shadow-[2px_0_0_0_var(--border)]">
                    Estudiante
                  </th>
                  {columns.map((col) => (
                    <th
                      key={col.id}
                      title={col.title}
                      className="min-w-24 border-r border-b bg-muted/40 px-2 py-1 text-center text-xs font-normal"
                    >
                      <div className="truncate">{col.title}</div>
                      <div className="text-[10px] text-muted-foreground">/{cap}</div>
                    </th>
                  ))}
                  {showAverage ? (
                    <th className="min-w-20 border-b bg-muted/70 px-2 py-1 text-center text-xs font-semibold">
                      Prom.
                      <div className="text-[10px] font-normal text-muted-foreground">/{cap}</div>
                    </th>
                  ) : null}
                </tr>
              </thead>
              <tbody>
                {studentsQuery.isLoading ? (
                  <tr>
                    <td colSpan={colSpan} className="px-3 py-6 text-center text-muted-foreground">
                      <Loader2Icon className="mx-auto size-4 animate-spin" />
                    </td>
                  </tr>
                ) : students.length === 0 ? (
                  <tr>
                    <td colSpan={colSpan} className="px-3 py-6 text-center text-muted-foreground">
                      Sin estudiantes en el curso.
                    </td>
                  </tr>
                ) : (
                  students.map((s, idx) => {
                    const ce = s.courseEnrollmentId
                    const rowBg = idx % 2 === 0 ? "bg-card" : "bg-muted"
                    const avg = rowAverage(ce)
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
                        {columns.map((col) => {
                          const k = `${ce}:${col.id}`
                          return (
                            <td key={col.id} className={cn("border-r px-1 py-1 text-center", rowBg)}>
                              <Input
                                type="number"
                                inputMode="decimal"
                                min={0}
                                max={cap}
                                step={0.5}
                                title={cellTitle(cellOf(col, ce))}
                                value={draft[k] ?? ""}
                                onChange={(ev) =>
                                  setDraft((d) => ({ ...d, [k]: ev.target.value }))
                                }
                                onBlur={(ev) => commit(ce, col, ev.target.value)}
                                className="h-9 w-16 text-center"
                              />
                            </td>
                          )
                        })}
                        {showAverage ? (
                          <td className={cn("px-2 py-1 text-center font-semibold", rowBg)}>
                            {avg === null ? "—" : round1(avg)}
                          </td>
                        ) : null}
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

      <p className="text-xs text-muted-foreground">
        Cada casilla admite hasta {cap} (tope de {meta.label}). Casilla vacía = no calificado
        (distinto de 0).{" "}
        {activityBased
          ? "El promedio de los criterios de la actividad es la nota de este criterio, y es de solo lectura."
          : "Esta casilla es directamente la nota del criterio."}
      </p>
    </div>
  )
}
