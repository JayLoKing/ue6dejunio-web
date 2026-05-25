import { useQuery } from "@tanstack/react-query"

import { httpClient } from "@/lib/axios"

import { TeacherStudentsUrl } from "../helpers/teacherStudentsPath"
import type { StudentResponse } from "../models/response/student-response"
import type { PagedResponse } from "@/features/users/models/response/user-response"

export const teacherStudentsKey = (userId: string) =>
  ["teachers", userId, "students"] as const

export function useTeacherStudents(userId: string | null | undefined) {
  return useQuery({
    queryKey: teacherStudentsKey(userId ?? ""),
    enabled: Boolean(userId),
    queryFn: async () => {
      const { data } = await httpClient.get<PagedResponse<StudentResponse>>(
        TeacherStudentsUrl.ByTeacher(userId as string),
      )
      return data.content
    },
    staleTime: 60_000,
  })
}
