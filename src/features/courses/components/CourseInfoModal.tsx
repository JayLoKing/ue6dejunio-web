import { Loader2Icon, TriangleAlertIcon, UserIcon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useAuthStore } from "@/features/auth/store/authStore"
import { isRole } from "@/features/auth/types"
import {
  useAcademicYears,
  useTeachers,
} from "@/features/catalog/hooks/useCatalog"

import {
  useCourseOverview,
  useReassignSubjectTeacher,
} from "../hooks/useCourses"
import type { Course } from "../types/course"
import { isTechnicalSubject } from "../utils/subject"
import { eligibleSubjectTeachers } from "../utils/subjectTeacher"

export interface CourseInfoModalProps {
  course: Course | null
  onClose: () => void
}

/** Info general del curso (solo lectura, Director): docente, totales, materias + encargado. */
export function CourseInfoModal({ course, onClose }: CourseInfoModalProps) {
  // trimester 1 solo para satisfacer el endpoint; aquí no se muestran notas.
  const overview = useCourseOverview(course?.id ?? null, 1)
  const data = overview.data

  const isDirector = isRole(
    useAuthStore((s) => s.role),
    "DIRECTOR"
  )
  const years = useAcademicYears()
  const aulaTeachers = useTeachers(false)
  const technicalTeachers = useTeachers(true)
  const reassign = useReassignSubjectTeacher()
  // La API responde 409 en una gestión cerrada: ni se ofrece, igual que en Trimestres.
  const yearClosed =
    years.data?.find((y) => y.id === course?.academicYearId)?.closed ?? false
  const canAssign = isDirector && !yearClosed

  // La matrícula de hoy, no `students.total`: ese conserva al estudiante retirado, y puesto
  // encima de varones y mujeres daba una suma que no cerraba sin explicar por qué.
  const totalStudents = data?.activeStudents ?? 0
  const classGroups = data?.classGroups ?? []
  // Docente actualizado desde el overview (refleja reasignaciones); prop como respaldo.
  const homeroomName =
    data?.course.homeroomTeacherName ?? course?.homeroomTeacherName ?? null
  // Con el overview en mano manda él, también cuando dice que no hay docente de aula: caer al
  // prop reviviría a uno que acaba de dejar el curso.
  const homeroomTeacherId = data
    ? data.course.homeroomTeacherId
    : (course?.homeroomTeacherId ?? null)

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
                  {classGroups.map((cg) => {
                    const technical = isTechnicalSubject(cg.subjectName)
                    const eligible = eligibleSubjectTeachers(technical, {
                      technicalTeachers: technicalTeachers.data ?? [],
                      aulaTeachers: aulaTeachers.data ?? [],
                      homeroomTeacherId,
                    })
                    // Quien la dicta hoy sigue en la lista aunque la regla ya no lo ofrezca (dado
                    // de baja, o de aula de otro curso): sin ello el selector queda vacío y el
                    // nombre se pierde.
                    const options =
                      cg.teacherId &&
                      !eligible.some((t) => t.id === cg.teacherId)
                        ? [
                            ...eligible,
                            {
                              id: cg.teacherId,
                              fullName: cg.teacherName || "Docente actual",
                            },
                          ]
                        : eligible
                    const saving =
                      reassign.isPending &&
                      reassign.variables?.classGroupId === cg.id
                    return (
                      <li
                        key={cg.id}
                        className="flex flex-col gap-1 rounded-md border px-3 py-1.5 text-sm"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="flex items-center gap-2">
                            {cg.subjectName}
                            {technical ? (
                              <Badge className="bg-warning/16 text-warning">
                                Técnica
                              </Badge>
                            ) : null}
                          </span>
                          {canAssign ? (
                            <Select
                              value={cg.teacherId ?? ""}
                              disabled={saving}
                              onValueChange={(teacherId) =>
                                reassign.mutate({
                                  courseId: cg.courseId,
                                  classGroupId: cg.id,
                                  teacherId,
                                })
                              }
                            >
                              <SelectTrigger
                                className="h-8 w-48 text-xs"
                                aria-label={`Docente de ${cg.subjectName}`}
                              >
                                <SelectValue placeholder="Sin docente" />
                              </SelectTrigger>
                              <SelectContent>
                                {options.map((t) => (
                                  <SelectItem key={t.id} value={t.id}>
                                    {t.fullName}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : (
                            <span className="text-muted-foreground">
                              {cg.teacherName || "Sin docente"}
                            </span>
                          )}
                        </div>
                        {canAssign && technical && !homeroomTeacherId ? (
                          <p className="text-xs text-muted-foreground">
                            Asigna primero el docente de aula del curso si
                            quieres que la dicte él; si no, elige un docente
                            técnico.
                          </p>
                        ) : null}
                      </li>
                    )
                  })}
                </ul>
              )}
              {yearClosed ? (
                <p className="mt-2 text-xs text-muted-foreground">
                  La gestión está cerrada: los docentes de sus materias ya no se
                  pueden cambiar.
                </p>
              ) : null}
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
