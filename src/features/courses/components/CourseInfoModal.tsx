import { Loader2Icon, TriangleAlertIcon, UserIcon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

import { useCourseOverview } from "../hooks/useCourses"
import type { Course } from "../types/course"
import { isTechnicalSubject } from "../utils/subject"

export interface CourseInfoModalProps {
  course: Course | null
  onClose: () => void
}

/** Info general del curso (solo lectura, Director): docente, totales, materias + encargado. */
export function CourseInfoModal({ course, onClose }: CourseInfoModalProps) {
  // trimester 1 solo para satisfacer el endpoint; aquí no se muestran notas.
  const overview = useCourseOverview(course?.id ?? null, 1)
  const data = overview.data

  // La matrícula de hoy, no `students.total`: ese conserva al estudiante retirado, y puesto
  // encima de varones y mujeres daba una suma que no cerraba sin explicar por qué.
  const totalStudents = data?.activeStudents ?? 0
  const classGroups = data?.classGroups ?? []
  // Docente actualizado desde el overview (refleja reasignaciones); prop como respaldo.
  const homeroomName =
    data?.course.homeroomTeacherName ?? course?.homeroomTeacherName ?? null

  return (
    <Dialog open={Boolean(course)} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {course ? `${course.gradeName} ${course.parallelName}` : "Curso"}
          </DialogTitle>
          <DialogDescription>Información general del curso</DialogDescription>
        </DialogHeader>

        {overview.isLoading ? (
          <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
            <Loader2Icon className="size-4 animate-spin" /> Cargando…
          </div>
        ) : overview.isError ? (
          <div className="flex items-center gap-2 py-6 text-sm text-destructive">
            <TriangleAlertIcon className="size-4" /> No se pudo cargar la
            información del curso.
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {/* Docente de aula + totales */}
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="col-span-2 flex items-center gap-2">
                <UserIcon className="size-4 text-muted-foreground" />
                <span className="text-muted-foreground">Docente de aula:</span>
                <span className="font-medium">
                  {homeroomName ?? "Sin asignar"}
                </span>
              </div>
              <Stat label="Total estudiantes" value={String(totalStudents)} />
              <Stat label="Año" value={course ? String(course.year) : "—"} />
              <Stat label="Varones" value={String(data?.males ?? 0)} />
              <Stat label="Mujeres" value={String(data?.females ?? 0)} />
            </div>

            {/* Materias + encargado */}
            <div>
              <p className="mb-2 text-sm font-medium">
                Materias ({classGroups.length})
              </p>
              {classGroups.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Sin materias asignadas.
                </p>
              ) : (
                <ul className="flex flex-col gap-1">
                  {classGroups.map((cg) => (
                    <li
                      key={cg.id}
                      className="flex items-center justify-between rounded-md border px-3 py-1.5 text-sm"
                    >
                      <span className="flex items-center gap-2">
                        {cg.subjectName}
                        {isTechnicalSubject(cg.subjectName) ? (
                          <Badge className="bg-warning/16 text-warning">
                            Técnica
                          </Badge>
                        ) : null}
                      </span>
                      <span className="text-muted-foreground">
                        {cg.teacherName || "Sin docente"}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

interface StatProps {
  label: string
  value: string
}

/** Un número con su etiqueta. El `hint` que tenía murió con el "pendiente backend". */
function Stat({ label, value }: StatProps) {
  return (
    <div className="rounded-md border p-2">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-lg font-semibold">{value}</div>
    </div>
  )
}
