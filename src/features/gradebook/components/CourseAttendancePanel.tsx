import { useMemo } from "react"
import { Loader2Icon } from "lucide-react"

import { cn } from "@/lib/utils"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"

import {
  useCourseAttendance,
  useCourseAttendanceStats,
} from "../hooks/useGradebook"
import type { AttendanceCounts } from "../types"

export interface CourseAttendancePanelProps {
  courseId: string
}

const MONTHS = [
  "Ene",
  "Feb",
  "Mar",
  "Abr",
  "May",
  "Jun",
  "Jul",
  "Ago",
  "Sep",
  "Oct",
  "Nov",
  "Dic",
]

// Estado crudo del backend (4 estados, no la versión colapsada P/A/L).
const STATUS_META: Record<
  string,
  { short: string; label: string; cls: string }
> = {
  Present: {
    short: "P",
    label: "Presente",
    cls: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  },
  Absent: {
    short: "F",
    label: "Falta",
    cls: "bg-destructive/15 text-destructive",
  },
  Late: {
    short: "R",
    label: "Retraso",
    cls: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  },
  Excused: {
    short: "L",
    label: "Licencia",
    cls: "bg-univalle/15 text-univalle",
  },
}

const pct = (p: number | null): string =>
  p === null ? "—" : `${Number(p).toFixed(1)}%`

const fmtDay = (iso: string): string => {
  const d = new Date(iso)
  return Number.isNaN(d.getTime())
    ? iso
    : d.toLocaleDateString("es-BO", { day: "2-digit", month: "2-digit" })
}

function Kpi({ label, counts }: { label: string; counts: AttendanceCounts }) {
  return (
    <div className="rounded-md border p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-2xl font-semibold">
        {counts.percentage === null ? (
          <span className="text-base font-normal text-muted-foreground">
            Sin sesiones computables
          </span>
        ) : (
          pct(counts.percentage)
        )}
      </div>
      <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-muted-foreground">
        <span>P {counts.present}</span>
        <span>F {counts.absent}</span>
        <span>R {counts.late}</span>
        <span>L {counts.excused}</span>
      </div>
    </div>
  )
}

/** Asistencia diaria del curso: KPIs de % + lista por fecha (solo lectura). */
export function CourseAttendancePanel({
  courseId,
}: CourseAttendancePanelProps) {
  const stats = useCourseAttendanceStats(courseId)
  const listQuery = useCourseAttendance(courseId, {
    offset: 1,
    limit: 200,
    sort: "asc",
  })

  const rows = useMemo(() => listQuery.data?.content ?? [], [listQuery.data])

  // Unión ordenada de todas las fechas registradas (columnas de la matriz).
  const dates = useMemo(() => {
    const set = new Set<string>()
    for (const r of rows) for (const a of r.attendances) set.add(a.date)
    return [...set].sort()
  }, [rows])

  const data = stats.data

  return (
    <div className="flex min-w-0 flex-col gap-4">
      {stats.isLoading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2Icon className="size-4 animate-spin" /> Cargando métricas…
        </div>
      ) : stats.isError || !data ? (
        <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
          No hay métricas de asistencia disponibles.
        </div>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Kpi label="General (anual)" counts={data.overall} />
            {data.byTrimester.map((t) => (
              <Kpi
                key={t.trimester}
                label={`Trimestre ${t.trimester}`}
                counts={t}
              />
            ))}
          </div>

          {data.byMonth.length > 0 ? (
            <div>
              <p className="mb-1 text-sm font-medium">Por mes</p>
              <div className="flex flex-wrap gap-2">
                {data.byMonth.map((m) => (
                  <div
                    key={`${m.year}-${m.month}`}
                    className="rounded-md border px-3 py-1.5 text-sm"
                  >
                    <span className="text-muted-foreground">
                      {MONTHS[m.month - 1] ?? m.month} {m.year}:{" "}
                    </span>
                    <span className="font-semibold">{pct(m.percentage)}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </>
      )}

      {/* Leyenda */}
      <div className="flex flex-wrap gap-2 text-[11px]">
        {Object.values(STATUS_META).map((s) => (
          <span key={s.short} className={cn("rounded px-1.5 py-0.5", s.cls)}>
            {s.short} = {s.label}
          </span>
        ))}
      </div>

      {/* Matriz estudiante × fecha */}
      <div className="min-w-0 overflow-hidden rounded-md border bg-card">
        <ScrollArea className="w-full whitespace-nowrap">
          <table className="w-max border-collapse text-sm">
            <thead>
              <tr>
                <th className="sticky left-0 z-20 min-w-[14rem] border-r border-b bg-muted px-3 py-2 text-left font-medium shadow-[2px_0_0_0_var(--border)]">
                  Estudiante
                </th>
                {dates.map((d) => (
                  <th
                    key={d}
                    className="min-w-12 border-r border-b bg-muted/50 px-1 py-2 text-center text-xs font-normal"
                  >
                    {fmtDay(d)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {listQuery.isLoading ? (
                <tr>
                  <td
                    colSpan={dates.length + 1}
                    className="px-3 py-6 text-center text-muted-foreground"
                  >
                    <Loader2Icon className="mx-auto size-4 animate-spin" />
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={dates.length + 1}
                    className="px-3 py-6 text-center text-muted-foreground"
                  >
                    Sin registros de asistencia.
                  </td>
                </tr>
              ) : (
                rows.map((r, idx) => {
                  const rowBg = idx % 2 === 0 ? "bg-card" : "bg-muted"
                  const byDate = new Map(
                    r.attendances.map((a) => [a.date, a.status])
                  )
                  return (
                    <tr key={r.courseEnrollmentId} className="border-t">
                      <td
                        className={cn(
                          "sticky left-0 z-10 min-w-[14rem] border-r px-3 py-2 font-medium shadow-[2px_0_0_0_var(--border)]",
                          rowBg
                        )}
                      >
                        {r.fullName}
                      </td>
                      {dates.map((d) => {
                        const status = byDate.get(d)
                        const meta = status ? STATUS_META[status] : undefined
                        return (
                          <td
                            key={d}
                            className={cn(
                              "border-r px-1 py-1 text-center",
                              rowBg
                            )}
                          >
                            {meta ? (
                              <span
                                title={meta.label}
                                className={cn(
                                  "inline-block w-6 rounded text-xs font-medium",
                                  meta.cls
                                )}
                              >
                                {meta.short}
                              </span>
                            ) : (
                              <span className="text-muted-foreground">·</span>
                            )}
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
    </div>
  )
}
