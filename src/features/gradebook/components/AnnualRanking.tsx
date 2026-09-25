import { useMemo } from "react"
import { Loader2Icon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { qualitativeBandOf, statusClassName, statusOf } from "@/lib/grading"

import { formatMark, rankedByFinalAverage } from "../utils/annualMarks"
import type { StudentAnnualSummary } from "../types"

export interface AnnualRankingProps {
  rows: StudentAnnualSummary[]
  isLoading?: boolean
}

/**
 * Hoja CRONOLOGIA ANUAL DE PROMEDIOS de la escuela: el promedio anual de cada estudiante, de mayor
 * a menor, con su banda cualitativa. La plantilla de ellos se titula "DE MAYOR A MENOR", así que
 * el orden es parte del reporte, no una comodidad.
 */
export function AnnualRanking({ rows, isLoading = false }: AnnualRankingProps) {
  const ranked = useMemo(() => rankedByFinalAverage(rows), [rows])

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">N°</TableHead>
            <TableHead>Apellidos y Nombres</TableHead>
            <TableHead className="text-center">Promedio anual</TableHead>
            <TableHead className="text-center">Cualitativo</TableHead>
            <TableHead className="text-center">Situación</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell
                colSpan={5}
                className="text-center text-muted-foreground"
              >
                <Loader2Icon className="mx-auto size-4 animate-spin" />
              </TableCell>
            </TableRow>
          ) : ranked.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={5}
                className="text-center text-muted-foreground"
              >
                Sin datos.
              </TableCell>
            </TableRow>
          ) : (
            ranked.map((row, idx) => {
              const final = row.finalAverage
              const status = final == null ? null : statusOf(Number(final))
              const band =
                final == null ? null : qualitativeBandOf(Number(final))
              return (
                <TableRow key={row.courseEnrollmentId}>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {idx + 1}
                  </TableCell>
                  <TableCell className="font-medium">{row.fullName}</TableCell>
                  <TableCell className="text-center font-semibold text-univalle">
                    {formatMark(final)}
                  </TableCell>
                  <TableCell className="text-center">
                    {band == null ? (
                      <span className="text-muted-foreground">
                        Sin calificar
                      </span>
                    ) : (
                      <>
                        {band.code} — {band.label}
                      </>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    {status == null ? (
                      <span className="text-muted-foreground">—</span>
                    ) : (
                      <Badge className={statusClassName(status)}>
                        {status === "APROBADO" ? "Aprobado" : "Reprobado"}
                      </Badge>
                    )}
                  </TableCell>
                </TableRow>
              )
            })
          )}
        </TableBody>
      </Table>
    </div>
  )
}
