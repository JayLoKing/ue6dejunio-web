import type { PagedResponse, PageQuery } from "@/lib/types/pagination"

import TeacherStudentsHelper from "../helpers/teacherStudentsHelper"
import type { StudentResponse } from "../models/response/student-response"

const helper = new TeacherStudentsHelper()

export interface TeacherSubject {
  subjectId: string
  subjectName: string
  classGroupId: string
}

export class TeacherStudentsService {
  static async byTeacher(
    userId: string,
    query: PageQuery,
  ): Promise<PagedResponse<StudentResponse>> {
    const { call } = helper.byTeacherAsync(userId, query)
    return (await call).data
  }

  /** Distinct subjects (with classGroupId) derived from a wide page. */
  static async subjects(userId: string): Promise<TeacherSubject[]> {
    const data = await TeacherStudentsService.byTeacher(userId, {
      offset: 1,
      limit: 200,
      sort: "asc",
    })
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
  }
}
