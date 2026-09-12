import { useMemo, type ReactNode } from "react"
import { Loader2Icon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { qualitativeBandOf, statusClassName, statusOf } from "@/lib/grading"

import { subjectColumnsOf } from "../utils/subjectColumns"
import { formatMark, trimesterMarksOf } from "../utils/annualMarks"
import type { StudentAnnualSummary } from "../types"

export interface AnnualCentralizerTableProps {
  rows: StudentAnnualSummary[]
  isLoading?: boolean
  /** Opcional: render del nombre del estudiante (p. ej. link a su detalle). */
  renderStudent?: (row: StudentAnnualSummary) => ReactNode
}

const TRIMESTER_HEADS = ["1", "2", "3", "PR"] as const

/**
 * Hoja CENTRALIZADOR ANUAL de la escuela: un bloque de 1 | 2 | 3 | PR por área de conocimiento,
 * cerrando con el promedio final y la situación final.
 *
 * Presentacional a propósito: todos los promedios los calcula la API, en un solo lugar, para que
 * esta hoja y la trimestral no puedan imprimir dos números distintos del mismo estudiante.
 */
export function AnnualCentralizerTable({
  rows,
  isLoading = false,
  renderStudent,
}: AnnualCentralizerTableProps) {
  const subjects = useMemo(() => subjectColumnsOf(rows), [rows])
  const columnCount = subjects.length * TRIMESTER_HEADS.length + 3

  return (
    <div className="min-w-0 overflow-hidden rounded-md border bg-card">
      <ScrollArea className="w-full whitespace-nowrap">
        <table className="w-max border-collapse text-sm">
          <thead>
            <tr>
              <th
                rowSpan={2}
                className="sticky left-0 z-20 min-w-[16rem] border-r border-b bg-muted px-3 py-2 text-left align-bottom font-medium shadow-[2px_0_0_0_var(--border)]"
              >
                Estudiante
              </th>
              {subjects.map((s) => (
                <th
                  key={s.classGroupId}
                  colSpan={TRIMESTER_HEADS.length}
                  title={s.subjectName}
                  className="max-w-40 border-r border-b bg-muted/50 px-2 py-2 text-center text-xs font-medium"
                >
                  <span className="block truncate">{s.subjectName}</span>
                </th>
              ))}
              <th
                rowSpan={2}
                className="min-w-28 border-r border-b bg-univalle/10 px-3 py-2 text-center align-bottom font-semibold text-univalle"
              >
                PROMEDIO FINAL
              </th>
              <th
                rowSpan={2}
                className="min-w-32 border-b bg-muted/50 px-3 py-2 text-center align-bottom font-medium"
              >
                SITUACIÓN FINAL
              </th>
            </tr>
            <tr>
              {subjects.flatMap((s) =>
                TRIMESTER_HEADS.map((head) => (
                  <th
                    key={`${s.classGroupId}-${head}`}
                    className={cn(
                      "min-w-12 border-r border-b px-2 py-1 text-center text-xs font-medium",
                      head === "PR" ? "bg-univalle/5 text-univalle" : "bg-muted/30"
                    )}
                  >
                    {head}
                  </th>
                ))
              )}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td
                  colSpan={columnCount}
                  className="px-3 py-6 text-center text-muted-foreground"
                >
                  <Loader2Icon className="mx-auto size-4 animate-spin" />
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td
                  colSpan={columnCount}
                  className="px-3 py-6 text-center text-muted-foreground"
                >
                  Sin datos.
                </td>
              </tr>
            ) : (
              rows.map((row, idx) => {
                const rowBg = idx % 2 === 0 ? "bg-card" : "bg-muted"
                const byId = new Map(row.subjects.map((s) => [s.classGroupId, s]))
                const final = row.finalAverage
                const status = final == null ? null : statusOf(Number(final))
                return (
                  <tr key={row.courseEnrollmentId} className="border-t">
                    <td
                      className={cn(
                        "sticky left-0 z-10 min-w-[16rem] border-r px-3 py-2 font-medium shadow-[2px_0_0_0_var(--border)]",
                        rowBg
                      )}
                    >
                      {renderStudent ? renderStudent(row) : row.fullName}
                    </td>
                    {subjects.flatMap((s) => {
                      const cell = byId.get(s.classGroupId)
                      return [
                        ...trimesterMarksOf(cell).map((mark, i) => (
                          <td
                            key={`${s.classGroupId}-t${i + 1}`}
                            className={cn("border-r px-2 py-2 text-center", rowBg)}
                          >
                            {/* Dos decimales, igual que el resto de la hoja. Redondear a entero
                                mostraría 50.6 como 51, que es la nota de aprobación: la planilla
                                diría aprobado donde el dato dice reprobado. */}
                            {formatMark(mark)}
                          </td>
                        )),
                        <td
                          key={`${s.classGroupId}-pr`}
                          className="border-r bg-univalle/5 px-2 py-2 text-center font-semibold text-univalle"
                        >
                          {formatMark(cell?.average ?? null)}
                        </td>,
                      ]
                    })}
                    <td className="border-r bg-univalle/10 px-3 py-2 text-center font-semibold text-univalle">
                      {formatMark(final)}
                    </td>
                    <td className={cn("px-3 py-2 text-center", rowBg)}>
                      {status == null ? (
                        <span className="text-muted-foreground">—</span>
                      ) : (
                        <Badge className={cn("gap-1", statusClassName(status))}>
                          {status === "APROBADO" ? "Aprobado" : "Reprobado"} ·{" "}
                          {qualitativeBandOf(Number(final)).code}
                        </Badge>
                      )}
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
  )
}
