import type { PagedResponse, PageQuery } from "@/lib/types/pagination"

import GradebookServiceHelper from "../helpers/gradebookServiceHelper"
import type {
  CourseAttendanceRow,
  CourseAttendanceStats,
  EnrollmentScore,
  HonorRollEntry,
  StudentAnnualSummary,
  StudentReportCard,
  StudentSummary,
} from "../types"

const helper = new GradebookServiceHelper()

export class GradebookService {
  static async studentSummary(
    courseEnrollmentId: string,
    trimester: number
  ): Promise<StudentSummary> {
    return (
      await helper.studentSummaryAsync(courseEnrollmentId, trimester).call
    ).data
  }
  static async centralizer(
    courseId: string,
    trimester: number,
    query: PageQuery
  ): Promise<PagedResponse<StudentSummary>> {
    return (await helper.centralizerAsync(courseId, trimester, query).call).data
  }
  static async annualCentralizer(
    courseId: string,
    query: PageQuery
  ): Promise<PagedResponse<StudentAnnualSummary>> {
    return (await helper.annualCentralizerAsync(courseId, query).call).data
  }
  static async honorRoll(
    courseId: string,
    places: number
  ): Promise<HonorRollEntry[]> {
    return (await helper.honorRollAsync(courseId, places).call).data
  }
  static async institutionHonorRoll(
    academicYearId: number,
    places: number
  ): Promise<HonorRollEntry[]> {
    return (await helper.institutionHonorRollAsync(academicYearId, places).call)
      .data
  }
  static async reportCard(
    courseEnrollmentId: string
  ): Promise<StudentReportCard> {
    return (await helper.reportCardAsync(courseEnrollmentId).call).data
  }
  static async attendance(
    courseId: string,
    query: PageQuery,
    date?: string
  ): Promise<PagedResponse<CourseAttendanceRow>> {
    return (await helper.attendanceAsync(courseId, query, date).call).data
  }
  static async enrollmentScores(
    courseEnrollmentId: string
  ): Promise<EnrollmentScore[]> {
    return (await helper.enrollmentScoresAsync(courseEnrollmentId).call).data
  }
  static async attendanceStats(
    courseId: string,
    trimester?: number
  ): Promise<CourseAttendanceStats> {
    return (await helper.attendanceStatsAsync(courseId, trimester).call).data
  }
}
