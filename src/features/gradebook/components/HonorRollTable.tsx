import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import { formatMark } from "../utils/annualMarks"
import type { HonorRollEntry } from "../types"

export interface HonorRollTableProps {
  rows: HonorRollEntry[]
  /**
   * Muestra el aula de cada estudiante. Sólo la gana la lista que abarca más de un curso: repetir
   * "Quinto B" en las tres filas del podio de Quinto B no dice nada.
   */
  showCourse?: boolean
}

/**
 * El podio: los mejores promedios finales, el mejor primero.
 *
 * Las filas se dibujan en el orden en que llegaron. La API ya las numeró, así que volver a
 * ordenarlas acá podría poner una fila marcada 2 encima de una marcada 1.
 */
export function HonorRollTable({ rows, showCourse }: HonorRollTableProps) {
  const columnCount = showCourse ? 4 : 3

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12 text-right">#</TableHead>
            <TableHead>Estudiante</TableHead>
            {showCourse ? <TableHead>Curso</TableHead> : null}
            <TableHead className="text-right">Promedio anual</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={columnCount}
                className="text-center text-muted-foreground"
              >
                Sin estudiantes calificados en esta gestión.
              </TableCell>
            </TableRow>
          ) : (
            rows.map((entry) => (
              <TableRow key={entry.courseEnrollmentId}>
                <TableCell className="text-right text-muted-foreground tabular-nums">
                  {entry.position}
                </TableCell>
                <TableCell className="font-medium">{entry.fullName}</TableCell>
                {showCourse ? (
                  <TableCell>
                    {entry.gradeName} {entry.parallelName}
                  </TableCell>
                ) : null}
                <TableCell className="text-right font-semibold tabular-nums">
                  {formatMark(entry.finalAverage)}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}
