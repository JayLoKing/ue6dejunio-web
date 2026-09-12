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
import { statusClassName, statusOf } from "@/lib/grading"

import { formatMark } from "../utils/annualMarks"
import type { StudentAnnualSummary } from "../types"

export interface TrimesterAveragesTableProps {
  rows: StudentAnnualSummary[]
  isLoading?: boolean
}

/**
 * Hoja PROMEDIOS POR TRIMESTRE de la escuela: los tres promedios trimestrales de cada estudiante
 * y el promedio final.
 *
 * El promedio final que se muestra acá es el mismo campo que imprime la matriz anual, no una
 * segunda suma de estas tres columnas. La plantilla de la escuela trae los dos y coinciden sólo
 * mientras cada área esté calificada en los tres trimestres: recalcularlo acá sería darle a la
 * escuela dos respuestas a una pregunta.
 */
export function TrimesterAveragesTable({
  rows,
  isLoading = false,
}: TrimesterAveragesTableProps) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">N°</TableHead>
            <TableHead>Apellido(s) y Nombre(s)</TableHead>
            <TableHead className="text-center">Primer trimestre</TableHead>
            <TableHead className="text-center">Segundo trimestre</TableHead>
            <TableHead className="text-center">Tercer trimestre</TableHead>
            <TableHead className="text-center">Promedio final</TableHead>
            <TableHead className="text-center">Situación final</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center text-muted-foreground">
                <Loader2Icon className="mx-auto size-4 animate-spin" />
              </TableCell>
            </TableRow>
          ) : rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center text-muted-foreground">
                Sin datos.
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row, idx) => {
              const final = row.finalAverage
              const status = final == null ? null : statusOf(Number(final))
              return (
                <TableRow key={row.courseEnrollmentId}>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {idx + 1}
                  </TableCell>
                  <TableCell className="font-medium">{row.fullName}</TableCell>
                  {[0, 1, 2].map((i) => (
                    <TableCell key={i} className="text-center">
                      {formatMark(row.trimesterAverages[i])}
                    </TableCell>
                  ))}
                  <TableCell className="text-center font-semibold text-univalle">
                    {formatMark(final)}
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
