import { useMemo, useState, type ReactNode } from "react"
import { Loader2Icon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { DataTablePagination } from "@/components/shared/DataTablePagination"
import { cualitativoOf, situacionClass, situacionOf } from "@/lib/grading"

import { useCentralizer } from "../hooks/useGradebook"
import type { StudentSummary } from "../types"

const shortLabel = (name: string) =>
  name.split(/\s+/).map((w) => w[0]).join("").slice(0, 4).toUpperCase()

export interface CentralizerTableProps {
  courseId: string
  /** Opcional: render del nombre del estudiante (p. ej. link a su detalle). */
  renderStudent?: (row: StudentSummary) => ReactNode
}

export function CentralizerTable({
  courseId,
  renderStudent,
}: CentralizerTableProps) {
  const [trimester, setTrimester] = useState(1)
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(20)

  const query = useMemo(() => ({ offset: page, limit, sort: "asc" as const }), [page, limit])
  const { data, isLoading, isFetching } = useCentralizer(courseId, trimester, query)

  const rows = useMemo<StudentSummary[]>(() => data?.content ?? [], [data])
  const subjects = useMemo(() => rows[0]?.subjects ?? [], [rows])

  const counters = useMemo(() => {
    let apr = 0
    let rep = 0
    for (const r of rows) {
      if (situacionOf(Number(r.generalAverage)) === "APROBADO") apr++
      else rep++
    }
    return { apr, rep }
  }, [rows])

  return (
    <div className="flex min-w-0 flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Trimestre</span>
          <Select value={String(trimester)} onValueChange={(v) => { setTrimester(Number(v)); setPage(1) }}>
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
        <div className="flex items-center gap-2 text-sm">
          <Badge variant="secondary">{counters.apr} aprobados</Badge>
          <Badge variant="outline" className="text-destructive">{counters.rep} reprobados</Badge>
        </div>
      </div>

      <div className="min-w-0 overflow-hidden rounded-md border bg-card">
        <ScrollArea className="w-full whitespace-nowrap">
          <table className="w-max border-collapse text-sm">
            <thead>
              <tr>
                <th className="sticky left-0 z-20 min-w-[16rem] border-r border-b bg-muted px-3 py-2 text-left font-medium shadow-[2px_0_0_0_var(--border)]">
                  Estudiante
                </th>
                {subjects.map((s) => (
                  <th key={s.classGroupId} title={s.subjectName} className="min-w-16 border-r border-b bg-muted/50 px-2 py-2 text-center font-medium">
                    {shortLabel(s.subjectName)}
                  </th>
                ))}
                <th className="min-w-24 border-r border-b bg-univalle/10 px-3 py-2 text-center font-semibold text-univalle">PROM.</th>
                <th className="min-w-32 border-b bg-muted/50 px-3 py-2 text-center font-medium">Situación</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={subjects.length + 3} className="px-3 py-6 text-center text-muted-foreground"><Loader2Icon className="mx-auto size-4 animate-spin" /></td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={subjects.length + 3} className="px-3 py-6 text-center text-muted-foreground">Sin datos.</td></tr>
              ) : (
                rows.map((r, idx) => {
                  const rowBg = idx % 2 === 0 ? "bg-card" : "bg-muted"
                  const avg = Number(r.generalAverage)
                  const sit = situacionOf(avg)
                  const cual = cualitativoOf(avg)
                  const byId = new Map(r.subjects.map((s) => [s.classGroupId, s]))
                  return (
                    <tr key={r.courseEnrollmentId} className="border-t">
                      <td className={cn("sticky left-0 z-10 min-w-[16rem] border-r px-3 py-2 font-medium shadow-[2px_0_0_0_var(--border)]", rowBg)}>
                        {renderStudent ? renderStudent(r) : r.fullName}
                      </td>
                      {subjects.map((s) => {
                        const cell = byId.get(s.classGroupId)
                        return (
                          <td key={s.classGroupId} className={cn("border-r px-2 py-2 text-center", rowBg)}>
                            {cell?.graded ? Number(cell.total).toFixed(1) : "—"}
                          </td>
                        )
                      })}
                      <td className="border-r bg-univalle/5 px-3 py-2 text-center font-semibold text-univalle">{avg.toFixed(2)}</td>
                      <td className={cn("px-3 py-2 text-center", rowBg)}>
                        <Badge className={cn("gap-1", situacionClass(sit))}>
                          {sit === "APROBADO" ? "Aprobado" : "Reprobado"} · {cual.code}
                        </Badge>
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

      <DataTablePagination
        page={data?.page != null ? data.page + 1 : page}
        pageSize={limit}
        total={data?.total ?? 0}
        totalPages={data?.totalPages ?? 1}
        isFetching={isFetching}
        onPageChange={setPage}
        onPageSizeChange={(s) => { setLimit(s); setPage(1) }}
      />
    </div>
  )
}
