import { useQuery, keepPreviousData, skipToken } from "@tanstack/react-query"

import type { PageQuery } from "@/lib/types/pagination"

import { TeacherStudentsService } from "../services/teacherStudentsService"

export const teacherStudentsKey = (userId: string, query: Partial<PageQuery>) =>
  ["teachers", userId, "students", query] as const

export function useTeacherStudents(
  userId: string | null | undefined,
  query: PageQuery
) {
  return useQuery({
    queryKey: teacherStudentsKey(userId ?? "", query),
    placeholderData: keepPreviousData,
    // skipToken en lugar de `enabled` + un cast: `enabled` es una guarda en tiempo de ejecución
    // que el compilador no ve, así que obligaba a afirmar `userId as string`. Acá el propio tipo
    // dice que sin usuario no hay consulta. Mismo patrón que useCourses.
    queryFn: userId
      ? () => TeacherStudentsService.byTeacher(userId, query)
      : skipToken,
    staleTime: 60_000,
  })
}

/** Distinct subjects the teacher teaches (with classGroupId). */
export function useTeacherSubjects(userId: string | null | undefined) {
  return useQuery({
    queryKey: ["teachers", userId ?? "", "subjects"],
    staleTime: 5 * 60_000,
    queryFn: userId ? () => TeacherStudentsService.subjects(userId) : skipToken,
  })
}
