import { useMemo, useState } from "react"
import { Loader2Icon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { TrimesterSelect } from "@/components/shared/TrimesterSelect"
import { qualitativeBandOf, statusClassName, statusOf } from "@/lib/grading"

import { useEnrollmentScores, useStudentSummary } from "../hooks/useGradebook"
import type { EnrollmentScore, StudentSubjectTotal } from "../types"

export interface StudentGradesDetailProps {
  courseEnrollmentId: string
  /**
   * true = docente que dicta en el curso pero no es su docente de aula: la API le devuelve solo
   * sus materias (con el promedio general real), y el consolidado por dimensión le da 403, así
   * que ni se pide.
   */
  ownSubjectsOnly?: boolean
}

const DIM_COLS: {
  label: string
  pick: (s: EnrollmentScore) => number | null
}[] = [
  { label: "SER", pick: (s) => s.scoreBeing },
  { label: "SABER", pick: (s) => s.scoreKnowing },
  { label: "HACER", pick: (s) => s.scoreDoing },
  { label: "AUTO", pick: (s) => s.scoreDeciding },
]

const fmt = (n: number | null): string =>
  n === null || Number.isNaN(Number(n)) ? "—" : Number(n).toFixed(1)

export function StudentGradesDetail({
  courseEnrollmentId,
  ownSubjectsOnly = false,
}: StudentGradesDetailProps) {
  const [trimester, setTrimester] = useState(1)
  const summary = useStudentSummary(courseEnrollmentId, trimester)
  const scoresQuery = useEnrollmentScores(
    ownSubjectsOnly ? null : courseEnrollmentId
  )

  const rows = useMemo(
    () => (scoresQuery.data ?? []).filter((s) => s.trimester === trimester),
    [scoresQuery.data, trimester]
  )

  const general = summary.data ? Number(summary.data.generalAverage) : null
  const status = general === null ? null : statusOf(general)
  const qualitative = general === null ? null : qualitativeBandOf(general)

  return (
    <div className="flex min-w-0 flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-col">
          <span className="text-lg font-semibold">
            {summary.data?.fullName ?? "Estudiante"}
          </span>
          {general !== null && status && qualitative ? (
            <span className="flex items-center gap-2 text-sm text-muted-foreground">
              Promedio general: <strong>{general.toFixed(2)}</strong>
              <Badge className={cn("gap-1", statusClassName(status))}>
                {status === "APROBADO" ? "Aprobado" : "Reprobado"} ·{" "}
                {qualitative.code}
              </Badge>
            </span>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Trimestre</span>
          <TrimesterSelect value={trimester} onChange={setTrimester} />
        </div>
      </div>

      {ownSubjectsOnly ? (
        <OwnSubjectsTable
          isLoading={summary.isLoading}
          isError={summary.isError}
          subjects={summary.data?.subjects ?? []}
        />
      ) : (
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
                <th className="min-w-20 border-b bg-brand/10 px-3 py-2 text-center font-semibold text-brand">
                  Total
                </th>
              </tr>
            </thead>
            <tbody>
              {summary.isLoading || scoresQuery.isLoading ? (
                <tr>
                  <td
                    colSpan={DIM_COLS.length + 2}
                    className="px-3 py-6 text-center text-muted-foreground"
                  >
                    <Loader2Icon className="mx-auto size-4 animate-spin" />
                  </td>
                </tr>
              ) : summary.isError || scoresQuery.isError ? (
                <tr>
                  <td
                    colSpan={DIM_COLS.length + 2}
                    className="px-3 py-6 text-center text-destructive"
                  >
                    No se pudo cargar el detalle del estudiante.
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={DIM_COLS.length + 2}
                    className="px-3 py-6 text-center text-muted-foreground"
                  >
                    Sin notas registradas en este trimestre.
                  </td>
                </tr>
              ) : (
                rows.map((s, idx) => {
                  const rowBg = idx % 2 === 0 ? "bg-card" : "bg-muted"
                  return (
                    <tr key={s.id} className="border-t">
                      <td
                        className={cn("border-r px-3 py-2 font-medium", rowBg)}
                      >
                        {s.subjectName}
                      </td>
                      {DIM_COLS.map((c) => (
                        <td
                          key={c.label}
                          className={cn(
                            "border-r px-2 py-2 text-center",
                            rowBg
                          )}
                        >
                          {fmt(c.pick(s))}
                        </td>
                      ))}
                      <td className="bg-brand/5 px-3 py-2 text-center font-semibold text-brand">
                        {fmt(s.totalScore)}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {ownSubjectsOnly ? (
        <p className="text-xs text-muted-foreground">
          Ves solo tus materias; el promedio general considera todas.
        </p>
      ) : (
        <p className="text-xs text-muted-foreground">
          Consolidado por dimensión (SER 10 · SABER 45 · HACER 40 · AUTO 5).
          Solo lectura.
        </p>
      )}
    </div>
  )
}

interface OwnSubjectsTableProps {
  isLoading: boolean
  isError: boolean
  subjects: StudentSubjectTotal[]
}

/** Las materias que el docente dicta a este estudiante: lo que la API le deja leer. */
function OwnSubjectsTable({
  isLoading,
  isError,
  subjects,
}: OwnSubjectsTableProps) {
  const message = (text: string, className: string) => (
    <tr>
      <td colSpan={2} className={cn("px-3 py-6 text-center", className)}>
        {text}
      </td>
    </tr>
  )

  return (
    <div className="min-w-0 overflow-hidden rounded-md border bg-card">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr>
            <th className="border-r border-b bg-muted px-3 py-2 text-left font-medium">
              Materia
            </th>
            <th className="min-w-20 border-b bg-brand/10 px-3 py-2 text-center font-semibold text-brand">
              Total
            </th>
          </tr>
        </thead>
        <tbody>
          {isLoading ? (
            <tr>
              <td colSpan={2} className="px-3 py-6 text-center">
                <Loader2Icon className="mx-auto size-4 animate-spin" />
              </td>
            </tr>
          ) : isError ? (
            message(
              "No se pudo cargar el detalle del estudiante.",
              "text-destructive"
            )
          ) : subjects.length === 0 ? (
            message(
              "Sin materias tuyas con este estudiante.",
              "text-muted-foreground"
            )
          ) : (
            subjects.map((s) => (
              <tr key={s.classGroupId} className="border-t">
                <td className="border-r px-3 py-2 font-medium">
                  {s.subjectName}
                </td>
                <td className="bg-brand/5 px-3 py-2 text-center font-semibold text-brand">
                  {s.graded ? fmt(s.total) : "—"}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
