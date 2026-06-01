import { useQuery, keepPreviousData } from "@tanstack/react-query"

import { httpClient } from "@/lib/axios"
import type { PagedResponse, PageQuery } from "@/lib/types/pagination"
import { toPageParams } from "@/lib/types/pagination"

import { TeacherStudentsUrl } from "../helpers/teacherStudentsPath"
import type { StudentResponse } from "../models/response/student-response"

export interface TeacherSubject {
  subjectId: string
  subjectName: string
  classGroupId: string
}

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
    queryFn: async () => {
      const { data } = await httpClient.get<PagedResponse<StudentResponse>>(
        TeacherStudentsUrl.ByTeacher(userId as string),
        { params: toPageParams(query) },
      )
      return data
    },
    staleTime: 60_000,
  })
}

/** Distinct subjects the teacher teaches (with classGroupId), from a wide page. */
export function useTeacherSubjects(userId: string | null | undefined) {
  return useQuery({
    queryKey: ["teachers", userId ?? "", "subjects"],
    enabled: Boolean(userId),
    staleTime: 5 * 60_000,
    queryFn: async (): Promise<TeacherSubject[]> => {
      const { data } = await httpClient.get<PagedResponse<StudentResponse>>(
        TeacherStudentsUrl.ByTeacher(userId as string),
        { params: { offset: 1, limit: 200, sort: "asc" } },
      )
      const map = new Map<string, TeacherSubject>()
      for (const s of data.content) {
        for (const e of s.enrollments) {
          if (!map.has(e.subjectId)) {
            map.set(e.subjectId, {
              subjectId: e.subjectId,
              subjectName: e.subjectName,
              classGroupId: e.classGroupId,
            })
          }
        }
      }
      return Array.from(map.values()).sort((a, b) =>
        a.subjectName.localeCompare(b.subjectName),
      )
    },
  })
}
