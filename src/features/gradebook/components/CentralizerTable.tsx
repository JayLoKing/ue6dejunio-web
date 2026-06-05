import { useMemo, useState } from "react"
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
import {
  cualitativoOf,
  situacionClass,
  situacionOf,
} from "@/lib/grading"

import { useCentralizer } from "../hooks/useCentralizer"
import type { TeacherSubject } from "@/features/students/services/teacherStudentsService"

export interface CentralizerTableProps {
  subjects: TeacherSubject[]
}

const SHORT = (name: string) =>
  name
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 4)
    .toUpperCase()

export function CentralizerTable({ subjects }: CentralizerTableProps) {
  const [trimester, setTrimester] = useState(1)
  const { subjects: cols, rows, isLoading } = useCentralizer(subjects, trimester)

  const counters = useMemo(() => {
    let apr = 0
    let rep = 0
    for (const r of rows) {
      if (situacionOf(r.promedioGeneral) === "APROBADO") apr++
      else rep++
    }
    return { apr, rep }
  }, [rows])

  return (
    <div className="flex min-w-0 flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Trimestre</span>
          <Select value={String(trimester)} onValueChange={(v) => setTrimester(Number(v))}>
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
          <Badge variant="outline" className="text-destructive">
            {counters.rep} reprobados
          </Badge>
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
                {cols.map((c) => (
                  <th
                    key={c.subjectId}
                    title={c.subjectName}
                    className="min-w-16 border-r border-b bg-muted/50 px-2 py-2 text-center font-medium"
                  >
                    {SHORT(c.subjectName)}
                  </th>
                ))}
                <th className="min-w-24 border-r border-b bg-univalle/10 px-3 py-2 text-center font-semibold text-univalle">
                  PROM.
                </th>
                <th className="min-w-32 border-b bg-muted/50 px-3 py-2 text-center font-medium">
                  Situacion
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={cols.length + 3} className="px-3 py-6 text-center text-muted-foreground">
                    <Loader2Icon className="mx-auto size-4 animate-spin" />
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={cols.length + 3} className="px-3 py-6 text-center text-muted-foreground">
                    Sin datos.
                  </td>
                </tr>
              ) : (
                rows.map((r, idx) => {
                  const rowBg = idx % 2 === 0 ? "bg-card" : "bg-muted"
                  const sit = situacionOf(r.promedioGeneral)
                  const cual = cualitativoOf(r.promedioGeneral)
                  return (
                    <tr key={r.studentId} className="border-t">
                      <td className={cn("sticky left-0 z-10 min-w-[16rem] border-r px-3 py-2 font-medium shadow-[2px_0_0_0_var(--border)]", rowBg)}>
                        {r.fullName}
                      </td>
                      {cols.map((c) => {
                        const v = r.bySubject[c.subjectId]
                        return (
                          <td key={c.subjectId} className={cn("border-r px-2 py-2 text-center", rowBg)}>
                            {v == null ? "—" : v.toFixed(1)}
                          </td>
                        )
                      })}
                      <td className="border-r bg-univalle/5 px-3 py-2 text-center font-semibold text-univalle">
                        {r.promedioGeneral.toFixed(2)}
                      </td>
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

      <p className="text-xs text-muted-foreground">
        Promedio general = media de las materias con nota registrada. Umbral aprobacion y
        escala cualitativa por confirmar con el docente.
      </p>
    </div>
  )
}
