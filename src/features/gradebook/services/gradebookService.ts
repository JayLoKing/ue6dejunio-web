import type { PagedResponse, PageQuery } from "@/lib/types/pagination"

import GradebookServiceHelper from "../helpers/gradebookServiceHelper"
import type { CourseAttendanceRow, StudentSummary } from "../types"

const helper = new GradebookServiceHelper()

export class GradebookService {
  static async studentSummary(
    courseEnrollmentId: string,
    trimester: number,
  ): Promise<StudentSummary> {
    return (await helper.studentSummaryAsync(courseEnrollmentId, trimester).call)
      .data
  }
  static async centralizer(
    courseId: string,
    trimester: number,
    query: PageQuery,
  ): Promise<PagedResponse<StudentSummary>> {
    return (await helper.centralizerAsync(courseId, trimester, query).call).data
  }
  static async attendance(
    courseId: string,
    query: PageQuery,
    date?: string,
  ): Promise<PagedResponse<CourseAttendanceRow>> {
    return (await helper.attendanceAsync(courseId, query, date).call).data
  }
}
