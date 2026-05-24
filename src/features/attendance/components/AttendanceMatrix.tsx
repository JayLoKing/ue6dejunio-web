import { useMemo, useState } from "react"
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
  year: number
  month: number
  initialData?: Record<string, Record<number, AttendanceCellStatus>>
}

type MatrixState = Record<string, Record<number, AttendanceCellStatus>>

const STATUS_STYLE: Record<
  Exclude<AttendanceCellStatus, null>,
  { label: string; cls: string }
> = {
  P: {
    label: "Presente",
    cls: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  },
  A: {
    label: "Ausente",
    cls: "bg-destructive/15 text-destructive",
  },
  L: {
    label: "Licencia",
    cls: "bg-univalle/15 text-univalle",
  },
}

const daysInMonth = (year: number, month: number): number =>
  new Date(year, month, 0).getDate()

const formatDate = (year: number, month: number, day: number): string =>
  `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`

export function AttendanceMatrix({
  students,
  year,
  month,
  initialData,
}: AttendanceMatrixProps) {
  const [matrix, setMatrix] = useState<MatrixState>(initialData ?? {})
  const totalDays = useMemo(() => daysInMonth(year, month), [year, month])
  const days = useMemo(
    () => Array.from({ length: totalDays }, (_, i) => i + 1),
    [totalDays],
  )

  const register = useRegisterAttendance()

  const handleCellClick = (enrollmentId: string, day: number) => {
    const current = matrix[enrollmentId]?.[day] ?? null
    const next = nextStatus(current)

    setMatrix((prev) => ({
      ...prev,
      [enrollmentId]: { ...(prev[enrollmentId] ?? {}), [day]: next },
    }))

    register.mutate({
      id_enrollment: enrollmentId,
      date: formatDate(year, month, day),
      status: CELL_TO_API[next],
    })
  }

  return (
    <div className="flex min-w-0 flex-col gap-3">
      <div className="flex items-center gap-3 text-sm text-muted-foreground">
        <CalendarDaysIcon className="size-4" />
        <span>
          Click ciclico:{" "}
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
                {days.map((d) => (
                  <th
                    key={d}
                    className="min-w-10 border-r border-b bg-muted/50 px-2 py-2 text-center font-medium last:border-r-0"
                  >
                    {d}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {students.length === 0 ? (
                <tr>
                  <td
                    colSpan={totalDays + 1}
                    className="px-3 py-6 text-center text-muted-foreground"
                  >
                    Sin estudiantes inscritos.
                  </td>
                </tr>
              ) : (
                students.map((s, idx) => {
                  const rowBg = idx % 2 === 0 ? "bg-card" : "bg-muted"
                  return (
                    <tr key={s.enrollmentId} className="border-t">
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
                          </span>
                        </div>
                      </td>
                      {days.map((d) => {
                        const status = matrix[s.enrollmentId]?.[d] ?? null
                        const style = status ? STATUS_STYLE[status] : null
                        return (
                          <td
                            key={d}
                            className={cn(
                              "border-r px-1 py-1 text-center last:border-r-0",
                              rowBg,
                            )}
                          >
                            <button
                              type="button"
                              onClick={() =>
                                handleCellClick(s.enrollmentId, d)
                              }
                              title={style?.label ?? "Sin registrar"}
                              className={cn(
                                "size-8 rounded-md text-xs font-semibold transition-colors hover:ring-2 hover:ring-univalle/40",
                                style?.cls ??
                                  "bg-muted/60 text-muted-foreground hover:bg-muted",
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
