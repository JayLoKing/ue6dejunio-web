import type { UseApiCall } from "@/lib/useApicall"
import { loadAbort } from "@/lib/loadAbort"
import { httpClient } from "@/lib/axios"
import type { PagedResponse, PageQuery } from "@/lib/types/pagination"
import { toPageParams } from "@/lib/types/pagination"

import { GradebookUrl } from "./gradebookPath"
import type { CourseAttendanceRow, CourseScoreRow } from "../types"

export interface CourseScoresParams extends PageQuery {
  classGroupId: string
  trimester?: number
}

export interface CourseAttendanceParams extends PageQuery {
  gradeId: number
  parallelId: number
  date?: string
}

export default class GradebookServiceHelper {
  scoresAsync(
    params: CourseScoresParams,
  ): UseApiCall<PagedResponse<CourseScoreRow>> {
    const controller = loadAbort()
    const { classGroupId, trimester, ...page } = params
    return {
      call: httpClient.get<PagedResponse<CourseScoreRow>>(GradebookUrl.Scores, {
        signal: controller.signal,
        params: toPageParams(page, {
          id_class_group: classGroupId,
          trimester,
        }),
      }),
      controller,
    }
  }

  attendanceAsync(
    params: CourseAttendanceParams,
  ): UseApiCall<PagedResponse<CourseAttendanceRow>> {
    const controller = loadAbort()
    const { gradeId, parallelId, date, ...page } = params
    return {
      call: httpClient.get<PagedResponse<CourseAttendanceRow>>(
        GradebookUrl.Attendance,
        {
          signal: controller.signal,
          params: toPageParams(page, {
            id_grade: gradeId,
            id_parallel: parallelId,
            date,
          }),
        },
      ),
      controller,
    }
  }
}
