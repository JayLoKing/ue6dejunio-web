import { useQuery, keepPreviousData } from "@tanstack/react-query"

import type { PageQuery } from "@/lib/types/pagination"

import {
  TeacherStudentsService,
  type TeacherSubject,
} from "../services/teacherStudentsService"

export type { TeacherSubject }

export const teacherStudentsKey = (
  userId: string,
  query: Partial<PageQuery>,
) => ["teachers", userId, "students", query] as const

export function useTeacherStudents(
  userId: string | null | undefined,
  query: PageQuery,
) {
  return useQuery({
    queryKey: teacherStudentsKey(userId ?? "", query),
    enabled: Boolean(userId),
    placeholderData: keepPreviousData,
    queryFn: () => TeacherStudentsService.byTeacher(userId as string, query),
    staleTime: 60_000,
  })
}

/** Distinct subjects the teacher teaches (with classGroupId). */
export function useTeacherSubjects(userId: string | null | undefined) {
  return useQuery({
    queryKey: ["teachers", userId ?? "", "subjects"],
    enabled: Boolean(userId),
    staleTime: 5 * 60_000,
    queryFn: () => TeacherStudentsService.subjects(userId as string),
  })
}
