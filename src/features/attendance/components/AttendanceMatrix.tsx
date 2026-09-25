import { useMemo, useState } from "react"
import { CalendarDaysIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"

import type { AttendanceApiStatus, AttendanceCellStatus } from "../types"
import { CELL_TO_API, nextStatus } from "../utils/attendanceStatus"

export interface AttendanceStudentRow {
  courseEnrollmentId: string
  fullName: string
}

export interface AttendanceMatrixProps {
  students: AttendanceStudentRow[]
  year: number
  month: number
  /** courseEnrollmentId → isoDate → cell */
  initialData?: Record<string, Record<string, AttendanceCellStatus>>
  /**
   * Records the mark. Returning the save lets the matrix take the mark back when it is rejected,
   * so hand back the promise rather than firing and forgetting.
   */
  onMark: (
    courseEnrollmentId: string,
    isoDate: string,
    status: AttendanceApiStatus
  ) => void | Promise<unknown>
}

const STATUS_STYLE: Record<
  Exclude<AttendanceCellStatus, null>,
  { label: string; cls: string }
> = {
  P: {
    label: "Presente",
    cls: "bg-success/12 text-success",
  },
  A: { label: "Ausente", cls: "bg-destructive/15 text-destructive" },
  L: { label: "Licencia", cls: "bg-brand/15 text-brand" },
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
      cols.push({
        iso: isoOf(year, month, d),
        day: d,
        letter: WEEKDAY_LETTER[dow],
      })
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
  // What the teacher clicked, kept apart from what the server sent. Mirroring the server into a
  // single draft meant every refetch overwrote clicks the mutation had not yet come back for, so a
  // mark could silently vanish from the screen while the request was still in flight. Reading the
  // local mark first keeps the click authoritative until the server catches up.
  const [marked, setMarked] = useState<
    Record<string, Record<string, AttendanceCellStatus>>
  >({})
  const cols = useMemo(() => weekdaysOfMonth(year, month), [year, month])
  const today = todayIso()

  const cellOf = (ceId: string, iso: string): AttendanceCellStatus =>
    marked[ceId]?.[iso] ?? initialData?.[ceId]?.[iso] ?? null

  const write = (ceId: string, iso: string, status: AttendanceCellStatus) =>
    setMarked((prev) => ({
      ...prev,
      [ceId]: { ...(prev[ceId] ?? {}), [iso]: status },
    }))

  const click = (ceId: string, iso: string) => {
    if (iso !== today) return
    const previous = cellOf(ceId, iso)
    const next = nextStatus(previous)
    write(ceId, iso, next)
    // The mark goes up on screen before the server confirms it, so a rejected save has to take it
    // back. Leaving it there would show attendance nobody recorded, and because the local mark
    // shadows the server's answer no later refetch could ever correct it.
    void Promise.resolve(onMark(ceId, iso, CELL_TO_API[next])).catch(() => {
      setMarked((prev) => {
        // Only take back the mark this save was for. Clicking again while the first save is in
        // flight already replaced it, and a late rejection must not undo the newer click.
        if ((prev[ceId]?.[iso] ?? null) !== next) return prev
        return { ...prev, [ceId]: { ...(prev[ceId] ?? {}), [iso]: previous } }
      })
    })
  }

  return (
    <div className="flex min-w-0 flex-col gap-3">
      <div className="flex items-center gap-3 text-sm text-muted-foreground">
        <CalendarDaysIcon className="size-4" />
        <span>
          Lun–Vie. Solo el día actual ({today}) es editable. Clic cíclico{" "}
          <span className="font-semibold text-success">P</span> →{" "}
          <span className="font-semibold text-destructive">A</span> →{" "}
          <span className="font-semibold text-brand">L</span>
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
                    <th
                      key={c.iso}
                      className={cn(
                        "min-w-11 border-r border-b px-2 py-1.5 text-center font-medium last:border-r-0",
                        isToday ? "bg-brand/15 text-brand" : "bg-muted/50"
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
                    Sin estudiantes.
                  </td>
                </tr>
              ) : (
                students.map((s, idx) => {
                  const rowBg = idx % 2 === 0 ? "bg-card" : "bg-muted"
                  return (
                    <tr key={s.courseEnrollmentId} className="border-t">
                      <td
                        className={cn(
                          "sticky left-0 z-10 min-w-[16rem] border-r px-3 py-2 shadow-[2px_0_0_0_var(--border)]",
                          rowBg
                        )}
                      >
                        <span className="font-medium">{s.fullName}</span>
                      </td>
                      {cols.map((c) => {
                        const status = cellOf(s.courseEnrollmentId, c.iso)
                        const style = status ? STATUS_STYLE[status] : null
                        const editable = c.iso === today
                        return (
                          <td
                            key={c.iso}
                            className={cn(
                              "border-r px-1 py-1 text-center last:border-r-0",
                              rowBg
                            )}
                          >
                            <button
                              type="button"
                              disabled={!editable}
                              onClick={() => click(s.courseEnrollmentId, c.iso)}
                              // The glyph alone repeats across every cell of the grid, so it names
                              // nothing. Saying whose day this is makes each cell reachable by
                              // name, out loud and from a test.
                              aria-label={`${s.fullName}, ${c.iso}: ${style?.label ?? "sin registrar"}`}
                              title={
                                editable
                                  ? (style?.label ?? "Registrar")
                                  : "Solo lectura"
                              }
                              className={cn(
                                "size-8 rounded-md text-xs font-semibold transition-colors",
                                editable && "hover:ring-2 hover:ring-brand/40",
                                !editable && "cursor-default",
                                style?.cls ??
                                  "bg-muted/60 text-muted-foreground"
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
    </div>
  )
}
