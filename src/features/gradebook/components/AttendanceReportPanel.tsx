import { useMemo } from "react"
import { Loader2Icon } from "lucide-react"

import { ExportReportButton } from "@/components/shared/ExportReportButton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useCourseAttendanceByStudent } from "@/features/courses/hooks/useCourses"
import { useInstitution } from "@/features/institution/hooks/useInstitution"
import { attendanceReportRows } from "@/features/reports/utils/reportRows"

/** Una página que alcanza para un curso entero: el reporte es de todos, no de los primeros veinte. */
const WHOLE_COURSE = { offset: 1, limit: 200, sort: "asc" as const }

/** RF 37: el porcentaje por estudiante y los totales de presentes, ausentes, licencias y atrasos. */
const COLUMNS = [
  { header: "N°", width: 600, align: "center" as const },
  { header: "Estudiante", width: 3600 },
  { header: "Presentes", width: 1100, align: "center" as const },
  { header: "Ausentes", width: 1100, align: "center" as const },
  { header: "Licencias", width: 1100, align: "center" as const },
  { header: "Atrasos", width: 1000, align: "center" as const },
  { header: "% asistencia", width: 1200, align: "center" as const },
]

export interface AttendanceReportPanelProps {
  courseId: string | null
  /** null = alcance anual, que es lo que el backend entiende por no recibir trimestre. */
  trimester: number | null
  /** Cómo nombrar el curso en el documento. Sin esto no se ofrece exportar. */
  courseLabel?: string
}

/**
 * El reporte de porcentaje de asistencia del curso (RF 37).
 *
 * El porcentaje lo calcula el backend y no esta pantalla, a propósito: es la misma cuenta que publica
 * el panel de asistencia del curso —presentes sobre presentes más ausentes más atrasos, la licencia
 * afuera— y recalcularla acá daría una cuarta definición de asistencia en un sistema que ya tiene
 * tres.
 *
 * Un porcentaje en null no es un cero: nadie marcó a ese estudiante, y un 0% afirmaría que faltó a
 * todo. Se muestra una raya, igual que en el documento.
 */
export function AttendanceReportPanel({
  courseId,
  trimester,
  courseLabel,
}: AttendanceReportPanelProps) {
  const report = useCourseAttendanceByStudent(courseId, trimester, WHOLE_COURSE)
  const { data: school } = useInstitution()

  const rows = useMemo(() => report.data?.students.content ?? [], [report.data])

  if (!courseId) {
    return (
      <p className="text-sm text-muted-foreground">
        Selecciona un curso para ver su reporte de asistencia.
      </p>
    )
  }

  if (report.isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2Icon className="size-4 animate-spin" />
        Cargando la asistencia del curso…
      </div>
    )
  }

  // Una consulta que falló no puede caer en la tabla vacía: "nadie tiene asistencia registrada" es
  // una respuesta sobre el curso, y es la contraria a "no se pudo preguntar".
  if (report.isError) {
    return (
      <p className="text-sm text-destructive">
        No se pudo cargar el reporte de asistencia. Reintenta en un momento.
      </p>
    )
  }

  const scopeLabel =
    trimester === null ? "Alcance anual" : `Trimestre ${trimester}`

  return (
    <div className="flex min-w-0 flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          El porcentaje cuenta presentes sobre los días computables. La licencia
          no descuenta ni suma; el atraso cuenta como falta.
        </p>
        {courseLabel ? (
          <ExportReportButton
            school={school}
            title="REPORTE DE PORCENTAJE DE ASISTENCIA"
            subtitles={[`Curso: ${courseLabel}`, scopeLabel]}
            columns={COLUMNS}
            rows={attendanceReportRows(rows)}
            emptyLabel="Sin estudiantes en el curso."
            filename={`asistencia-${courseLabel.replace(/\s+/g, "-").toLowerCase()}-${
              trimester === null ? "anual" : `t${trimester}`
            }`}
          />
        ) : null}
      </div>

      <div className="overflow-hidden rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12 text-center">N°</TableHead>
              <TableHead>Estudiante</TableHead>
              <TableHead className="text-center">Presentes</TableHead>
              <TableHead className="text-center">Ausentes</TableHead>
              <TableHead className="text-center">Licencias</TableHead>
              <TableHead className="text-center">Atrasos</TableHead>
              <TableHead className="text-center">% asistencia</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="py-8 text-center text-muted-foreground"
                >
                  Sin estudiantes en el curso.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row, index) => (
                <TableRow key={row.courseEnrollmentId}>
                  <TableCell className="text-center">{index + 1}</TableCell>
                  <TableCell className="font-medium">
                    {row.studentName}
                  </TableCell>
                  <TableCell className="text-center">{row.present}</TableCell>
                  <TableCell className="text-center">{row.absent}</TableCell>
                  <TableCell className="text-center">{row.excused}</TableCell>
                  <TableCell className="text-center">{row.late}</TableCell>
                  <TableCell className="text-center font-semibold">
                    {row.percentage === null
                      ? "—"
                      : `${row.percentage.toFixed(1)}%`}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
