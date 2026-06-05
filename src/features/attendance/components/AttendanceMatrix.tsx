import { useEffect, useMemo, useState } from "react"
import { CalendarDaysIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"

import {
  CELL_TO_API,
  nextStatus,
  type AttendanceCellStatus,
  type StudentEnrollmentRow,
} from "../types"
import { useRegisterAttendance } from "../hooks/useRegisterAttendance"

export interface AttendanceMatrixProps {
  students: StudentEnrollmentRow[]
  subjectId: string
  year: number
  month: number
  initialData?: Record<string, Record<string, AttendanceCellStatus>>
}

// matrix keyed by enrollmentId → { isoDate: status }
type MatrixState = Record<string, Record<string, AttendanceCellStatus>>

const STATUS_STYLE: Record<
  Exclude<AttendanceCellStatus, null>,
  { label: string; cls: string }
> = {
  P: { label: "Presente", cls: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300" },
  A: { label: "Ausente", cls: "bg-destructive/15 text-destructive" },
  L: { label: "Licencia", cls: "bg-univalle/15 text-univalle" },
}

const WEEKDAY_LETTER = ["D", "L", "M", "M", "J", "V", "S"]

interface DayCol {
  iso: string
  day: number
  letter: string
}

const pad = (n: number) => String(n).padStart(2, "0")
const isoOf = (y: number, m: number, d: number) => `${y}-${pad(m)}-${pad(d)}`

/** Weekdays (Mon–Fri) of the month as real dates. */
const weekdaysOfMonth = (year: number, month: number): DayCol[] => {
  const total = new Date(year, month, 0).getDate()
  const cols: DayCol[] = []
  for (let d = 1; d <= total; d++) {
    const dow = new Date(year, month - 1, d).getDay()
    if (dow >= 1 && dow <= 5) {
      cols.push({ iso: isoOf(year, month, d), day: d, letter: WEEKDAY_LETTER[dow] })
    }
  }
  return cols
}

const todayIso = (): string => {
  const n = new Date()
  return isoOf(n.getFullYear(), n.getMonth() + 1, n.getDate())
}

export function AttendanceMatrix({
  students,
  subjectId,
  year,
  month,
  initialData,
}: AttendanceMatrixProps) {
  const [matrix, setMatrix] = useState<MatrixState>(initialData ?? {})
  const cols = useMemo(() => weekdaysOfMonth(year, month), [year, month])
  const today = todayIso()

  // Re-seed from server data when subject/month (initialData) changes.
  useEffect(() => {
    setMatrix(initialData ?? {})
  }, [initialData])

  const register = useRegisterAttendance()

  const handleCellClick = (enrollmentId: string | undefined, iso: string) => {
    if (!enrollmentId) return
    if (iso !== today) return // edit only current day
    const current = matrix[enrollmentId]?.[iso] ?? null
    const next = nextStatus(current)
    setMatrix((prev) => ({
      ...prev,
      [enrollmentId]: { ...(prev[enrollmentId] ?? {}), [iso]: next },
    }))
    register.mutate({
      id_enrollment: enrollmentId,
      date: iso,
      status: CELL_TO_API[next],
    })
  }

  return (
    <div className="flex min-w-0 flex-col gap-3">
      <div className="flex items-center gap-3 text-sm text-muted-foreground">
        <CalendarDaysIcon className="size-4" />
        <span>
          Lun–Vie. Solo el dia actual ({today}) es editable. Click ciclico:{" "}
          <span className="font-semibold text-emerald-600">P</span> →{" "}
          <span className="font-semibold text-destructive">A</span> →{" "}
          <span className="font-semibold text-univalle">L</span>
        </span>
      </div>

      <div className="min-w-0 overflow-hidden rounded-md border bg-card">
        <ScrollArea className="w-full whitespace-nowrap">
          <table className="w-max border-collapse text-sm">
            <thead>
              <tr>
                <th className="sticky left-0 z-20 min-w-[18rem] border-r border-b bg-muted px-3 py-2 text-left font-medium shadow-[2px_0_0_0_var(--border)]">
                  Estudiante
                </th>
                {cols.map((c) => {
                  const isToday = c.iso === today
                  return (
                    <th
                      key={c.iso}
                      className={cn(
                        "min-w-11 border-r border-b px-2 py-1.5 text-center font-medium last:border-r-0",
                        isToday ? "bg-univalle/15 text-univalle" : "bg-muted/50",
                      )}
                    >
                      <div className="flex flex-col leading-tight">
                        <span className="text-[10px] font-normal text-muted-foreground">
                          {c.letter}
                        </span>
                        <span>{c.day}</span>
                      </div>
                    </th>
                  )
                })}
              </tr>
            </thead>
            <tbody>
              {students.length === 0 ? (
                <tr>
                  <td
                    colSpan={cols.length + 1}
                    className="px-3 py-6 text-center text-muted-foreground"
                  >
                    Sin estudiantes inscritos.
                  </td>
                </tr>
              ) : (
                students.map((s, idx) => {
                  const rowBg = idx % 2 === 0 ? "bg-card" : "bg-muted"
                  const enrollmentId = s.enrollmentsBySubject[subjectId]
                  const disabledRow = !enrollmentId
                  return (
                    <tr key={s.studentId} className="border-t">
                      <td
                        className={cn(
                          "sticky left-0 z-10 min-w-[18rem] border-r px-3 py-2 shadow-[2px_0_0_0_var(--border)]",
                          rowBg,
                        )}
                      >
                        <div className="flex flex-col leading-tight">
                          <span className="font-medium">{s.fullName}</span>
                          <span className="font-mono text-xs text-muted-foreground">
                            RUDE {s.rudeCode}
                            {disabledRow ? " — no inscrito" : ""}
                          </span>
                        </div>
                      </td>
                      {cols.map((c) => {
                        const status = enrollmentId
                          ? matrix[enrollmentId]?.[c.iso] ?? null
                          : null
                        const style = status ? STATUS_STYLE[status] : null
                        const editable = !disabledRow && c.iso === today
                        return (
                          <td
                            key={c.iso}
                            className={cn(
                              "border-r px-1 py-1 text-center last:border-r-0",
                              rowBg,
                            )}
                          >
                            <button
                              type="button"
                              disabled={!editable}
                              onClick={() => handleCellClick(enrollmentId, c.iso)}
                              title={
                                disabledRow
                                  ? "Sin inscripcion"
                                  : c.iso === today
                                    ? (style?.label ?? "Registrar")
                                    : "Solo lectura (no es el dia actual)"
                              }
                              className={cn(
                                "size-8 rounded-md text-xs font-semibold transition-colors",
                                editable && "hover:ring-2 hover:ring-univalle/40",
                                !editable && "cursor-default",
                                style?.cls ??
                                  "bg-muted/60 text-muted-foreground",
                              )}
                            >
                              {status ?? "·"}
                            </button>
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

      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <LegendDot cls="bg-emerald-500" label="Presente" />
        <LegendDot cls="bg-destructive" label="Ausente" />
        <LegendDot cls="bg-univalle" label="Licencia" />
        {register.isPending ? <span>Guardando...</span> : null}
        <div className="ml-auto">
          <Button size="sm" variant="outline" disabled>
            Exportar planilla
          </Button>
        </div>
      </div>
    </div>
  )
}

function LegendDot({ cls, label }: { cls: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className={cn("inline-block size-3 rounded-sm", cls)} />
      <span>{label}</span>
    </div>
  )
}
