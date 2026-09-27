import {
  keepPreviousData,
  skipToken,
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from "@tanstack/react-query"
import { toast } from "sonner"

import type { PageQuery } from "@/lib/types/pagination"

import { CourseService } from "../services/courseService"
import type { CreateCoursePayload } from "../types/course"

export function useCourses(query: PageQuery, academicYearId?: number) {
  return useQuery({
    queryKey: ["courses", query, academicYearId ?? null],
    queryFn: () => CourseService.list(query, academicYearId),
    placeholderData: keepPreviousData,
  })
}

/** All courses (wide page) — for selectors and homeroom lookup. */
export function useAllCourses(enabled = true) {
  return useQuery({
    queryKey: ["courses", "all"],
    queryFn: () => CourseService.list({ offset: 1, limit: 200, sort: "asc" }),
    enabled,
    staleTime: 5 * 60_000,
  })
}

export function useTeacherClassGroups(userId: string | null | undefined) {
  return useQuery({
    queryKey: ["teacher", userId ?? "", "class-groups"],
    staleTime: 5 * 60_000,
    queryFn: userId
      ? () => CourseService.teacherClassGroups(userId)
      : skipToken,
  })
}

/** Vista consolidada del curso (Director): header + materias(docente) + estudiantes. */
export function useCourseOverview(
  courseId: string | null | undefined,
  trimester: number
) {
  return useQuery({
    queryKey: ["course-overview", courseId ?? "", trimester],
    queryFn: courseId
      ? () =>
          CourseService.overview(courseId, trimester, {
            offset: 1,
            limit: 200,
            sort: "asc",
          })
      : skipToken,
  })
}

/**
 * RF 37: el porcentaje de asistencia de cada estudiante del curso.
 *
 * `trimester` en null es el alcance anual, y viaja en la clave: dos alcances del mismo curso son dos
 * respuestas distintas, y compartir la clave haría que cambiar de trimestre mostrara la del anterior.
 */
export function useCourseAttendanceByStudent(
  courseId: string | null | undefined,
  trimester: number | null,
  query: PageQuery
) {
  return useQuery({
    queryKey: [
      "course-attendance-by-student",
      courseId ?? "",
      trimester ?? "annual",
      query,
    ],
    placeholderData: keepPreviousData,
    queryFn: courseId
      ? () => CourseService.attendanceByStudent(courseId, trimester, query)
      : skipToken,
  })
}

export function useCourseStudents(
  courseId: string | null | undefined,
  query: PageQuery
) {
  return useQuery({
    queryKey: ["course-students", courseId ?? "", query],
    placeholderData: keepPreviousData,
    queryFn: courseId
      ? () => CourseService.students(courseId, query)
      : skipToken,
  })
}

// ---- Admin (Director): crear curso, docente de aula, materias ----

/**
 * Todo lo que queda viejo cuando un curso cambia.
 *
 * Exportado porque no sólo lo mueven las acciones de esta feature: dar de baja a un usuario cambia
 * `homeroomTeacherActive` del curso que tenía a cargo, y quien hace esa baja vive en Usuarios.
 */
export const coursesKeys = {
  all: ["courses"] as const,
  overview: ["course-overview"] as const,
  students: ["course-students"] as const,
  /**
   * Las materias que dicta un docente. Cuenta como clave de curso aunque no lo parezca: un
   * intercambio de docentes de aula le cambia la lista a dos personas, y sin invalidarla el
   * docente sigue viendo las materias del curso que dejó durante cinco minutos.
   */
  teacherClassGroups: ["teacher"] as const,
}

/** Derivado de las claves de arriba, no reescrito: dos listas se separan sin que nadie lo note. */
const STALE_ON_COURSE_CHANGE = [
  coursesKeys.all,
  coursesKeys.overview,
  coursesKeys.students,
  coursesKeys.teacherClassGroups,
]

/**
 * Invalida todo lo que un cambio de curso deja viejo.
 *
 * Toma el cliente en vez de ser un hook porque quien lo llama no siempre está en esta feature: dar
 * de baja o renombrar a un usuario cambia el nombre y el estado del docente de aula que el curso
 * guarda, y esa acción vive en Usuarios.
 */
export function invalidateCourses(qc: QueryClient) {
  for (const queryKey of STALE_ON_COURSE_CHANGE) {
    void qc.invalidateQueries({ queryKey })
  }
}

function useInvalidateCourses() {
  const qc = useQueryClient()
  return () => invalidateCourses(qc)
}

export function useCreateCourse() {
  const invalidate = useInvalidateCourses()
  return useMutation({
    mutationFn: (p: CreateCoursePayload) => CourseService.create(p),
    onSuccess: () => {
      toast.success("Curso creado.")
      invalidate()
    },
  })
}

export function useSetHomeroom() {
  const invalidate = useInvalidateCourses()
  return useMutation({
    mutationFn: (v: { id: string; teacherId: string }) =>
      CourseService.setHomeroom(v.id, v.teacherId),
    onSuccess: () => {
      toast.success("Docente de aula asignado.")
      invalidate()
    },
  })
}

/** Intercambia el docente de aula entre dos cursos, ambos activos (ninguno de baja). */
export function useSwapHomeroom() {
  const invalidate = useInvalidateCourses()
  return useMutation({
    mutationFn: (v: { courseAId: string; courseBId: string }) =>
      CourseService.swapHomeroom(v.courseAId, v.courseBId),
    onSuccess: () => {
      toast.success("Docentes de aula intercambiados.")
      invalidate()
    },
  })
}
