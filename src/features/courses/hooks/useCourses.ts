import { keepPreviousData, useQuery } from "@tanstack/react-query"

import type { PageQuery } from "@/lib/types/pagination"

import { CourseService } from "../services/courseService"

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
