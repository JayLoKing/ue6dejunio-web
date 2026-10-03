import { useState } from "react"
import { Loader2Icon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useAcademicYears } from "@/features/catalog/hooks/useCatalog"
import { WITHDRAWN } from "@/lib/enrollment"

import { useNotReenrolled } from "../hooks/useStudent"

/**
 * Radix no acepta un item con valor vacío, así que "gestión actual" necesita una palabra propia.
 * Nunca sale de este archivo: hacia el hook, sin elegir es `undefined`.
 */
const CURRENT = "current"

/**
 * Quienes cursaron la gestión anterior y todavía no tienen cupo en la elegida.
 *
 * Cada estado se dice por separado: una consulta fallida no puede leerse como "nadie falta", ni
 * una gestión sin antecesora como "todos volvieron". Un retirado aparece marcado, porque que no
 * haya vuelto es lo esperado y no una omisión de la escuela.
 */
export function NotReenrolledReport() {
  const [yearId, setYearId] = useState<number | undefined>(undefined)
  const years = useAcademicYears()
  const report = useNotReenrolled(yearId)

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="not-reenrolled-year">Gestión</Label>
        <Select
          value={yearId === undefined ? CURRENT : String(yearId)}
          onValueChange={(v) =>
            setYearId(v === CURRENT ? undefined : Number(v))
          }
        >
          <SelectTrigger id="not-reenrolled-year" className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={CURRENT}>Gestión actual</SelectItem>
            {(years.data ?? []).map((y) => (
              <SelectItem key={y.id} value={String(y.id)}>
                {y.year}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <ReportBody
        isLoading={report.isLoading}
        isError={report.isError}
        data={report.data}
        onRetry={() => void report.refetch()}
      />
    </div>
  )
}

function ReportBody({
  isLoading,
  isError,
  data,
  onRetry,
}: {
  isLoading: boolean
  isError: boolean
  data: ReturnType<typeof useNotReenrolled>["data"]
  onRetry: () => void
}) {
  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2Icon className="size-4 animate-spin" />
        Cargando reporte...
      </div>
    )
  }

  // Antes que el vacío: una consulta fallida no trae lista, y mostrarla como vacía diría que nadie
  // dejó de volver.
  if (isError || !data) {
    return (
      <div className="flex flex-col items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
        No se pudo cargar el reporte.
        <Button variant="outline" size="sm" onClick={onRetry}>
          Reintentar
        </Button>
      </div>
    )
  }

  if (!data.previousYear) {
    return (
      <p className="text-sm text-muted-foreground">
        No hay gestión anterior registrada para comparar con la gestión{" "}
        {data.academicYear.year}.
      </p>
    )
  }

  const { students } = data

  // Sin faltantes sólo queda la frase de que todos volvieron: un encabezado "0 estudiantes" la repetiría.
  if (students.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Todos los estudiantes de la gestión {data.previousYear.year} ya tienen
        curso en la {data.academicYear.year}.
      </p>
    )
  }

  const one = students.length === 1

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm">
        <span className="font-medium">
          {students.length} {one ? "estudiante" : "estudiantes"}
        </span>{" "}
        de la gestión {data.previousYear.year} {one ? "no tiene" : "no tienen"}{" "}
        curso en la gestión {data.academicYear.year}.
      </p>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Curso anterior</TableHead>
              <TableHead>Nombre completo</TableHead>
              <TableHead>RUDE</TableHead>
              <TableHead>Carnet</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {students.map((s) => (
              <TableRow key={s.studentId}>
                <TableCell>{s.lastCourse.name}</TableCell>
                <TableCell>{s.fullName}</TableCell>
                <TableCell className="font-mono text-xs">
                  {s.rudeCode}
                </TableCell>
                <TableCell className="font-mono text-xs">
                  {s.identityCard}
                </TableCell>
                <TableCell>
                  {s.status === WITHDRAWN ? (
                    <Badge variant="outline">Retirado</Badge>
                  ) : null}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
