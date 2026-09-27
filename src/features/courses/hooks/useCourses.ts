import {
  keepPreviousData,
  skipToken,
  useMutation,
  useQuery,
  useQueryClient,
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
  /** Las tres a la vez, que es como se invalidan siempre. */
  everything: [["courses"], ["course-overview"], ["course-students"]] as const,
}

function useInvalidateCourses() {
  const qc = useQueryClient()
  return () => {
    for (const queryKey of coursesKeys.everything) {
      void qc.invalidateQueries({ queryKey })
    }
  }
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
