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
  type AssessmentEvent,
  type Criterion,
} from "@/features/assessment/types"
import {
  useCriteria,
  useCriteriaEvents,
  useEventScores,
  useSetScore,
} from "@/features/assessment/hooks/useAssessment"
import { CriteriaManager } from "@/features/assessment/components/CriteriaManager"

export interface SubjectScoreSheetProps {
  classGroup: ClassGroupItem
}

type Trimester = 1 | 2 | 3

export function SubjectScoreSheet({ classGroup }: SubjectScoreSheetProps) {
  const [trimester, setTrimester] = useState<Trimester>(1)
  const [draft, setDraft] = useState<Record<string, number>>({})

  const { data: criteria = [], isLoading: critLoading } = useCriteria(
    classGroup.id,
    trimester,
  )
  const { byCriterion, isLoading: evLoading } = useCriteriaEvents(criteria)

  const studentsQuery = useCourseStudents(classGroup.courseId, {
    offset: 1,
    limit: 200,
    sort: "asc",
  })
  const students = useMemo(
    () => studentsQuery.data?.content ?? [],
    [studentsQuery.data],
  )

  // flat events (in dimension→criterion order) for columns
  const columns = useMemo(() => {
    const cols: { dimKey: string; criterion: Criterion; event: AssessmentEvent }[] = []
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

  useEffect(() => {
    const next: Record<string, number> = {}
    for (const s of students) {
      for (const col of columns) {
        const cell = matrix[col.event.id]?.[s.courseEnrollmentId]
        if (cell) next[`${s.courseEnrollmentId}:${col.event.id}`] = cell.score
      }
    }
    setDraft(next)
  }, [students, columns, matrix])

  const commit = (ce: string, ev: AssessmentEvent, raw: string) => {
    let val = Number(raw)
    if (!Number.isFinite(val) || val < 0) val = 0
    if (val > ev.maxScore) val = ev.maxScore
    const prev = matrix[ev.id]?.[ce]?.score ?? null
    if (prev === val) return
    setScore.mutate({
      id_course_enrollment: ce,
      id_assessment_event: ev.id,
      score: val,
    })
  }

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
              <p className="font-medium">
                Define criterios antes de cargar notas.
              </p>
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
                      <th rowSpan={2} className="sticky left-0 z-20 min-w-[16rem] border-r border-b bg-muted px-3 py-2 text-left align-bottom font-medium shadow-[2px_0_0_0_var(--border)]">
                        Estudiante
                      </th>
                      {DIMENSIONS.map((dim) => {
                        const dimCols = columns.filter((c) => c.dimKey === dim.key)
                        if (dimCols.length === 0) return null
                        return (
                          <th key={dim.key} colSpan={dimCols.length} className="border-r border-b bg-muted/60 px-2 py-1.5 text-center font-semibold">
                            {dim.label} <span className="text-xs font-normal text-muted-foreground">/{dim.weight}</span>
                          </th>
                        )
                      })}
                    </tr>
                    <tr>
                      {columns.map((col) => (
                        <th key={col.event.id} title={`${col.criterion.name} · ${col.event.title}`} className="min-w-24 border-r border-b bg-muted/40 px-2 py-1 text-center text-xs font-normal">
                          <div className="truncate">{col.event.title}</div>
                          <div className="text-[10px] text-muted-foreground">/{col.event.maxScore}</div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {studentsQuery.isLoading ? (
                      <tr>
                        <td colSpan={columns.length + 1} className="px-3 py-6 text-center text-muted-foreground">
                          <Loader2Icon className="mx-auto size-4 animate-spin" />
                        </td>
                      </tr>
                    ) : students.length === 0 ? (
                      <tr>
                        <td colSpan={columns.length + 1} className="px-3 py-6 text-center text-muted-foreground">
                          Sin estudiantes en el curso.
                        </td>
                      </tr>
                    ) : (
                      students.map((s, idx) => {
                        const rowBg = idx % 2 === 0 ? "bg-card" : "bg-muted"
                        return (
                          <tr key={s.courseEnrollmentId} className="border-t">
                            <td className={cn("sticky left-0 z-10 min-w-[16rem] border-r px-3 py-2 font-medium shadow-[2px_0_0_0_var(--border)]", rowBg)}>
                              {s.fullName}
                            </td>
                            {columns.map((col) => {
                              const k = `${s.courseEnrollmentId}:${col.event.id}`
                              return (
                                <td key={col.event.id} className={cn("border-r px-1 py-1 text-center", rowBg)}>
                                  <Input
                                    type="number"
                                    inputMode="decimal"
                                    min={0}
                                    max={col.event.maxScore}
                                    step={0.5}
                                    value={draft[k] ?? ""}
                                    onChange={(e) =>
                                      setDraft((d) => ({ ...d, [k]: Number(e.target.value) }))
                                    }
                                    onBlur={(e) => commit(s.courseEnrollmentId, col.event, e.target.value)}
                                    className="h-9 w-16 text-center"
                                  />
                                </td>
                              )
                            })}
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
            La nota por actividad se guarda al salir del campo. Promedios por
            criterio, dimension y total son de solo lectura (consolidados por el
            sistema) — ver Reportes.
          </p>
          {evLoading ? null : <Fragment />}
        </TabsContent>

        <TabsContent value="criterios" className="pt-4">
          <CriteriaManager classGroupId={classGroup.id} trimester={trimester} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
