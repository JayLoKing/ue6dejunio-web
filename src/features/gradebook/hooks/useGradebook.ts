import { keepPreviousData, useQuery } from "@tanstack/react-query"

import type { PageQuery } from "@/lib/types/pagination"

import { GradebookService } from "../services/gradebookService"

export function useCentralizer(
  courseId: string | null | undefined,
  trimester: number,
  query: PageQuery,
) {
  return useQuery({
    queryKey: ["gradebook", "centralizer", courseId ?? "", trimester, query],
    queryFn: () =>
      GradebookService.centralizer(courseId as string, trimester, query),
    enabled: Boolean(courseId),
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
    queryFn: () => GradebookService.attendance(courseId as string, query, date),
    enabled: Boolean(courseId),
    placeholderData: keepPreviousData,
  })
}

export function useStudentSummary(
  courseEnrollmentId: string | null | undefined,
  trimester: number,
) {
  return useQuery({
    queryKey: ["gradebook", "student-summary", courseEnrollmentId ?? "", trimester],
    queryFn: () =>
      GradebookService.studentSummary(courseEnrollmentId as string, trimester),
    enabled: Boolean(courseEnrollmentId),
  })
}
