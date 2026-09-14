import type { UseApiCall } from "@/lib/useApicall"
import { loadAbort } from "@/lib/loadAbort"
import { httpClient } from "@/lib/axios"
import type { PagedResponse, PageQuery } from "@/lib/types/pagination"
import { toPageParams } from "@/lib/types/pagination"

import { CourseStatsUrl, GradebookUrl, ScoreUrl } from "./gradebookPath"
import type {
  CourseAttendanceRow,
  CourseAttendanceStats,
  EnrollmentScore,
  HonorRollEntry,
  StudentAnnualSummary,
  StudentReportCard,
  StudentSummary,
} from "../types"

export default class GradebookServiceHelper {
  studentSummaryAsync(
    courseEnrollmentId: string,
    trimester: number
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
    query: PageQuery
  ): UseApiCall<PagedResponse<StudentSummary>> {
    const controller = loadAbort()
    return {
      call: httpClient.get<PagedResponse<StudentSummary>>(
        GradebookUrl.Centralizer,
        {
          signal: controller.signal,
          params: toPageParams(query, { id_course: courseId, trimester }),
        }
      ),
      controller,
    }
  }

  honorRollAsync(
    courseId: string,
    places: number
  ): UseApiCall<HonorRollEntry[]> {
    const controller = loadAbort()
    return {
      call: httpClient.get<HonorRollEntry[]>(GradebookUrl.HonorRoll, {
        signal: controller.signal,
        params: { id_course: courseId, places },
      }),
      controller,
    }
  }

  /**
   * @param academicYearId la clave de la fila de la gestión, no el año calendario:
   *   `id_academic_year` es un SERIAL.
   */
  institutionHonorRollAsync(
    academicYearId: number,
    places: number
  ): UseApiCall<HonorRollEntry[]> {
    const controller = loadAbort()
    return {
      call: httpClient.get<HonorRollEntry[]>(
        GradebookUrl.HonorRollInstitution,
        {
          signal: controller.signal,
          params: { id_academic_year: academicYearId, places },
        }
      ),
      controller,
    }
  }

  /** Sin parámetro de trimestre: el curso ya fija su gestión, y la hoja es el año entero. */
  annualCentralizerAsync(
    courseId: string,
    query: PageQuery
  ): UseApiCall<PagedResponse<StudentAnnualSummary>> {
    const controller = loadAbort()
    return {
      call: httpClient.get<PagedResponse<StudentAnnualSummary>>(
        GradebookUrl.AnnualCentralizer,
        {
          signal: controller.signal,
          params: toPageParams(query, { id_course: courseId }),
        }
      ),
      controller,
    }
  }

  /** La libreta de un estudiante. El encabezado de la escuela se pide aparte, una sola vez. */
  reportCardAsync(courseEnrollmentId: string): UseApiCall<StudentReportCard> {
    const controller = loadAbort()
    return {
      call: httpClient.get<StudentReportCard>(GradebookUrl.ReportCard, {
        signal: controller.signal,
        params: { id_course_enrollment: courseEnrollmentId },
      }),
      controller,
    }
  }

  attendanceStatsAsync(
    courseId: string,
    trimester?: number
  ): UseApiCall<CourseAttendanceStats> {
    const controller = loadAbort()
    return {
      call: httpClient.get<CourseAttendanceStats>(
        CourseStatsUrl.AttendanceStats(courseId),
        {
          signal: controller.signal,
          params: trimester === undefined ? undefined : { trimester },
        }
      ),
      controller,
    }
  }

  enrollmentScoresAsync(
    courseEnrollmentId: string
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
    date?: string
  ): UseApiCall<PagedResponse<CourseAttendanceRow>> {
    const controller = loadAbort()
    return {
      call: httpClient.get<PagedResponse<CourseAttendanceRow>>(
        GradebookUrl.Attendance,
        {
          signal: controller.signal,
          params: toPageParams(query, { id_course: courseId, date }),
        }
      ),
      controller,
    }
  }
}
