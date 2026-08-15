import { keepPreviousData, skipToken, useQuery } from "@tanstack/react-query"

import type { PageQuery } from "@/lib/types/pagination"

import { GradebookService } from "../services/gradebookService"

export function useCentralizer(
  courseId: string | null | undefined,
  trimester: number,
  query: PageQuery,
) {
  return useQuery({
    queryKey: ["gradebook", "centralizer", courseId ?? "", trimester, query],
    queryFn: courseId
      ? () => GradebookService.centralizer(courseId, trimester, query)
      : skipToken,
    placeholderData: keepPreviousData,
  })
}

export function useCourseAttendance(
  courseId: string | null | undefined,
  query: PageQuery,
  date?: string,
) {
  return useQuery({
    queryKey: ["gradebook", "attendance", courseId ?? "", query, date ?? null],
    queryFn: courseId
      ? () => GradebookService.attendance(courseId, query, date)
      : skipToken,
    placeholderData: keepPreviousData,
  })
}

export function useStudentSummary(
  courseEnrollmentId: string | null | undefined,
  trimester: number,
) {
  return useQuery({
    queryKey: ["gradebook", "student-summary", courseEnrollmentId ?? "", trimester],
    queryFn: courseEnrollmentId
      ? () => GradebookService.studentSummary(courseEnrollmentId, trimester)
      : skipToken,
  })
}

/** Consolidado por dimensión (todas las materias) de un course_enrollment. */
export function useEnrollmentScores(
  courseEnrollmentId: string | null | undefined,
) {
  return useQuery({
    queryKey: ["scores", "enrollment", courseEnrollmentId ?? ""],
    queryFn: courseEnrollmentId
      ? () => GradebookService.enrollmentScores(courseEnrollmentId)
      : skipToken,
  })
}
