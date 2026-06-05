import type { PagedResponse } from "@/lib/types/pagination"

import GradebookServiceHelper, {
  type CourseAttendanceParams,
  type CourseScoresParams,
} from "../helpers/gradebookServiceHelper"
import type { CourseAttendanceRow, CourseScoreRow } from "../types"

export type { CourseAttendanceParams, CourseScoresParams }

const helper = new GradebookServiceHelper()

export class GradebookService {
  static async scores(
    params: CourseScoresParams,
  ): Promise<PagedResponse<CourseScoreRow>> {
    const { call } = helper.scoresAsync(params)
    return (await call).data
  }

  static async attendance(
    params: CourseAttendanceParams,
  ): Promise<PagedResponse<CourseAttendanceRow>> {
    const { call } = helper.attendanceAsync(params)
    return (await call).data
  }
}
