import { useEffect, useMemo, useState } from "react"
import { CalendarDaysIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"

import {
  CELL_TO_API,
  nextStatus,
  type AttendanceApiStatus,
  type AttendanceCellStatus,
} from "../types"

export interface AttendanceStudentRow {
  courseEnrollmentId: string
  fullName: string
  rudeCode?: string
}

export interface AttendanceMatrixProps {
  students: AttendanceStudentRow[]
  year: number
  month: number
  /** courseEnrollmentId → isoDate → cell */
  initialData?: Record<string, Record<string, AttendanceCellStatus>>
  onMark: (
    courseEnrollmentId: string,
    isoDate: string,
    status: AttendanceApiStatus,
  ) => void
}

const STATUS_STYLE: Record<
  Exclude<AttendanceCellStatus, null>,
  { label: string; cls: string }
> = {
  P: { label: "Presente", cls: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300" },
  A: { label: "Ausente", cls: "bg-destructive/15 text-destructive" },
  L: { label: "Licencia", cls: "bg-univalle/15 text-univalle" },
}

const WEEKDAY_LETTER = ["D", "L", "M", "M", "J", "V", "S"]
const pad = (n: number) => String(n).padStart(2, "0")
const isoOf = (y: number, m: number, d: number) => `${y}-${pad(m)}-${pad(d)}`

const weekdaysOfMonth = (year: number, month: number) => {
  const total = new Date(year, month, 0).getDate()
  const cols: { iso: string; day: number; letter: string }[] = []
  for (let d = 1; d <= total; d++) {
    const dow = new Date(year, month - 1, d).getDay()
    if (dow >= 1 && dow <= 5)
      cols.push({ iso: isoOf(year, month, d), day: d, letter: WEEKDAY_LETTER[dow] })
  }
  return cols
}

const todayIso = () => {
  const n = new Date()
  return isoOf(n.getFullYear(), n.getMonth() + 1, n.getDate())
}

export function AttendanceMatrix({
  students,
  year,
  month,
  initialData,
  onMark,
}: AttendanceMatrixProps) {
  const [matrix, setMatrix] = useState(initialData ?? {})
  const cols = useMemo(() => weekdaysOfMonth(year, month), [year, month])
  const today = todayIso()

  useEffect(() => setMatrix(initialData ?? {}), [initialData])

  const click = (ceId: string, iso: string) => {
    if (iso !== today) return
    const current = matrix[ceId]?.[iso] ?? null
    const next = nextStatus(current)
    setMatrix((prev) => ({ ...prev, [ceId]: { ...(prev[ceId] ?? {}), [iso]: next } }))
    onMark(ceId, iso, CELL_TO_API[next])
  }

  return (
    <div className="flex min-w-0 flex-col gap-3">
      <div className="flex items-center gap-3 text-sm text-muted-foreground">
        <CalendarDaysIcon className="size-4" />
        <span>
          Lun–Vie. Solo el dia actual ({today}) es editable. Click ciclico{" "}
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
                <th className="sticky left-0 z-20 min-w-[16rem] border-r border-b bg-muted px-3 py-2 text-left font-medium shadow-[2px_0_0_0_var(--border)]">
                  Estudiante
                </th>
                {cols.map((c) => {
                  const isToday = c.iso === today
                  return (
                    <th key={c.iso} className={cn("min-w-11 border-r border-b px-2 py-1.5 text-center font-medium last:border-r-0", isToday ? "bg-univalle/15 text-univalle" : "bg-muted/50")}>
                      <div className="flex flex-col leading-tight">
                        <span className="text-[10px] font-normal text-muted-foreground">{c.letter}</span>
                        <span>{c.day}</span>
                      </div>
                    </th>
                  )
                })}
              </tr>
            </thead>
            <tbody>
              {students.length === 0 ? (
                <tr><td colSpan={cols.length + 1} className="px-3 py-6 text-center text-muted-foreground">Sin estudiantes.</td></tr>
              ) : (
                students.map((s, idx) => {
                  const rowBg = idx % 2 === 0 ? "bg-card" : "bg-muted"
                  return (
                    <tr key={s.courseEnrollmentId} className="border-t">
                      <td className={cn("sticky left-0 z-10 min-w-[16rem] border-r px-3 py-2 shadow-[2px_0_0_0_var(--border)]", rowBg)}>
                        <span className="font-medium">{s.fullName}</span>
                      </td>
                      {cols.map((c) => {
                        const status = matrix[s.courseEnrollmentId]?.[c.iso] ?? null
                        const style = status ? STATUS_STYLE[status] : null
                        const editable = c.iso === today
                        return (
                          <td key={c.iso} className={cn("border-r px-1 py-1 text-center last:border-r-0", rowBg)}>
                            <button
                              type="button"
                              disabled={!editable}
                              onClick={() => click(s.courseEnrollmentId, c.iso)}
                              title={editable ? (style?.label ?? "Registrar") : "Solo lectura"}
                              className={cn("size-8 rounded-md text-xs font-semibold transition-colors", editable && "hover:ring-2 hover:ring-univalle/40", !editable && "cursor-default", style?.cls ?? "bg-muted/60 text-muted-foreground")}
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
    </div>
  )
}
