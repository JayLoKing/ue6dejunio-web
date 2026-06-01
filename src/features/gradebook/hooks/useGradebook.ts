import { useQuery, keepPreviousData } from "@tanstack/react-query"

import {
  GradebookService,
  type CourseAttendanceParams,
  type CourseScoresParams,
} from "../services/gradebookService"

export function useCourseScores(params: CourseScoresParams, enabled = true) {
  return useQuery({
    queryKey: ["gradebook", "scores", params],
    queryFn: () => GradebookService.scores(params),
    enabled: enabled && Boolean(params.classGroupId),
    placeholderData: keepPreviousData,
  })
}

export function useCourseAttendance(
  params: CourseAttendanceParams,
  enabled = true,
) {
  return useQuery({
    queryKey: ["gradebook", "attendance", params],
    queryFn: () => GradebookService.attendance(params),
    enabled: enabled && Boolean(params.gradeId && params.parallelId),
    placeholderData: keepPreviousData,
  })
}
