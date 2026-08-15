import { useMemo, useState } from "react"
import { Loader2Icon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { TrimesterSelect } from "@/components/shared/TrimesterSelect"
import { cualitativoOf, situacionClass, situacionOf } from "@/lib/grading"

import { useEnrollmentScores, useStudentSummary } from "../hooks/useGradebook"
import type { EnrollmentScore } from "../types"

export interface StudentGradesDetailProps {
  courseEnrollmentId: string
}

const DIM_COLS: { label: string; pick: (s: EnrollmentScore) => number | null }[] = [
  { label: "SER", pick: (s) => s.scoreBeing },
  { label: "SABER", pick: (s) => s.scoreKnowing },
  { label: "HACER", pick: (s) => s.scoreDoing },
  { label: "AUTO", pick: (s) => s.scoreDeciding },
]

const fmt = (n: number | null): string =>
  n === null || Number.isNaN(Number(n)) ? "—" : Number(n).toFixed(1)

export function StudentGradesDetail({ courseEnrollmentId }: StudentGradesDetailProps) {
  const [trimester, setTrimester] = useState(1)
  const summary = useStudentSummary(courseEnrollmentId, trimester)
  const scoresQuery = useEnrollmentScores(courseEnrollmentId)

  const rows = useMemo(
    () => (scoresQuery.data ?? []).filter((s) => s.trimester === trimester),
    [scoresQuery.data, trimester],
  )

  const general = summary.data ? Number(summary.data.generalAverage) : null
  const sit = general === null ? null : situacionOf(general)
  const cual = general === null ? null : cualitativoOf(general)

  return (
    <div className="flex min-w-0 flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-col">
          <span className="text-lg font-semibold">
            {summary.data?.fullName ?? "Estudiante"}
          </span>
          {general !== null && sit && cual ? (
            <span className="flex items-center gap-2 text-sm text-muted-foreground">
              Promedio general: <strong>{general.toFixed(2)}</strong>
              <Badge className={cn("gap-1", situacionClass(sit))}>
                {sit === "APROBADO" ? "Aprobado" : "Reprobado"} · {cual.code}
              </Badge>
            </span>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Trimestre</span>
          <TrimesterSelect value={trimester} onChange={setTrimester} />
        </div>
      </div>

      <div className="min-w-0 overflow-hidden rounded-md border bg-card">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr>
              <th className="border-r border-b bg-muted px-3 py-2 text-left font-medium">
                Materia
              </th>
              {DIM_COLS.map((c) => (
                <th
                  key={c.label}
                  className="min-w-16 border-r border-b bg-muted/50 px-2 py-2 text-center font-medium"
                >
                  {c.label}
                </th>
              ))}
              <th className="min-w-20 border-b bg-univalle/10 px-3 py-2 text-center font-semibold text-univalle">
                Total
              </th>
            </tr>
          </thead>
          <tbody>
            {summary.isLoading || scoresQuery.isLoading ? (
              <tr>
                <td colSpan={DIM_COLS.length + 2} className="px-3 py-6 text-center text-muted-foreground">
                  <Loader2Icon className="mx-auto size-4 animate-spin" />
                </td>
              </tr>
            ) : summary.isError || scoresQuery.isError ? (
              <tr>
                <td colSpan={DIM_COLS.length + 2} className="px-3 py-6 text-center text-destructive">
                  No se pudo cargar el detalle del estudiante.
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={DIM_COLS.length + 2} className="px-3 py-6 text-center text-muted-foreground">
                  Sin notas registradas en este trimestre.
                </td>
              </tr>
            ) : (
              rows.map((s, idx) => {
                const rowBg = idx % 2 === 0 ? "bg-card" : "bg-muted"
                return (
                  <tr key={s.id} className="border-t">
                    <td className={cn("border-r px-3 py-2 font-medium", rowBg)}>
                      {s.subjectName}
                    </td>
                    {DIM_COLS.map((c) => (
                      <td
                        key={c.label}
                        className={cn("border-r px-2 py-2 text-center", rowBg)}
                      >
                        {fmt(c.pick(s))}
                      </td>
                    ))}
                    <td className="bg-univalle/5 px-3 py-2 text-center font-semibold text-univalle">
                      {fmt(s.totalScore)}
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-muted-foreground">
        Consolidado por dimensión (SER 10 · SABER 45 · HACER 40 · AUTO 5). Solo
        lectura.
      </p>
    </div>
  )
}
