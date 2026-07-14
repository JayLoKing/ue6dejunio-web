import {
  keepPreviousData,
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
    enabled: Boolean(userId),
    staleTime: 5 * 60_000,
    queryFn: () => CourseService.teacherClassGroups(userId as string),
  })
}

export function useCourseStudents(
  courseId: string | null | undefined,
  query: PageQuery,
) {
  return useQuery({
    queryKey: ["course-students", courseId ?? "", query],
    enabled: Boolean(courseId),
    placeholderData: keepPreviousData,
    queryFn: () => CourseService.students(courseId as string, query),
  })
}

// ---- Admin (Director): crear curso, docente de aula, materias ----

function useInvalidateCourses() {
  const qc = useQueryClient()
  return () => void qc.invalidateQueries({ queryKey: ["courses"] })
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

