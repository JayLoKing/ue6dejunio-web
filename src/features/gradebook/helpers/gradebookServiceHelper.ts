import type { UseApiCall } from "@/lib/useApicall"
import { loadAbort } from "@/lib/loadAbort"
import { httpClient } from "@/lib/axios"
import type { PagedResponse, PageQuery } from "@/lib/types/pagination"
import { toPageParams } from "@/lib/types/pagination"

import { GradebookUrl, ScoreUrl } from "./gradebookPath"
import type {
  CourseAttendanceRow,
  EnrollmentScore,
  StudentSummary,
} from "../types"

export default class GradebookServiceHelper {
  studentSummaryAsync(
    courseEnrollmentId: string,
    trimester: number,
  ): UseApiCall<StudentSummary> {
    const controller = loadAbort()
    return {
      call: httpClient.get<StudentSummary>(GradebookUrl.StudentSummary, {
        signal: controller.signal,
        params: { id_course_enrollment: courseEnrollmentId, trimester },
      }),
      controller,
    }
  }

  centralizerAsync(
    courseId: string,
    trimester: number,
    query: PageQuery,
  ): UseApiCall<PagedResponse<StudentSummary>> {
    const controller = loadAbort()
    return {
      call: httpClient.get<PagedResponse<StudentSummary>>(
        GradebookUrl.Centralizer,
        {
          signal: controller.signal,
          params: toPageParams(query, { id_course: courseId, trimester }),
        },
      ),
      controller,
    }
  }

  enrollmentScoresAsync(
    courseEnrollmentId: string,
  ): UseApiCall<EnrollmentScore[]> {
    const controller = loadAbort()
    return {
      call: httpClient.get<EnrollmentScore[]>(ScoreUrl.Base, {
        signal: controller.signal,
        params: { id_course_enrollment: courseEnrollmentId },
      }),
      controller,
    }
  }

  attendanceAsync(
    courseId: string,
    query: PageQuery,
    date?: string,
  ): UseApiCall<PagedResponse<CourseAttendanceRow>> {
    const controller = loadAbort()
    return {
      call: httpClient.get<PagedResponse<CourseAttendanceRow>>(
        GradebookUrl.Attendance,
        {
          signal: controller.signal,
          params: toPageParams(query, { id_course: courseId, date }),
        },
      ),
      controller,
    }
  }
}
