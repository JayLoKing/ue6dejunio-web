import { httpClient } from "@/lib/axios"
import type { PagedResponse, PageQuery } from "@/lib/types/pagination"
import { toPageParams } from "@/lib/types/pagination"

import { GradebookUrl } from "../helpers/gradebookPath"
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

export class GradebookService {
  static async scores(
    params: CourseScoresParams,
  ): Promise<PagedResponse<CourseScoreRow>> {
    const { classGroupId, trimester, ...page } = params
    const { data } = await httpClient.get<PagedResponse<CourseScoreRow>>(
      GradebookUrl.Scores,
      {
        params: toPageParams(page, {
          id_class_group: classGroupId,
          trimester,
        }),
      },
    )
    return data
  }

  static async attendance(
    params: CourseAttendanceParams,
  ): Promise<PagedResponse<CourseAttendanceRow>> {
    const { gradeId, parallelId, date, ...page } = params
    const { data } = await httpClient.get<PagedResponse<CourseAttendanceRow>>(
      GradebookUrl.Attendance,
      {
        params: toPageParams(page, {
          id_grade: gradeId,
          id_parallel: parallelId,
          date,
        }),
      },
    )
    return data
  }
}
