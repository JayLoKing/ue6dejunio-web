import { useQuery } from "@tanstack/react-query"

import { AttendanceService } from "../services/attendanceService"

export const attendanceKey = (enrollmentId: string) =>
  ["attendance", "enrollment", enrollmentId] as const

export function useAttendanceByEnrollment(enrollmentId: string | null) {
  return useQuery({
    queryKey: attendanceKey(enrollmentId ?? ""),
    enabled: Boolean(enrollmentId),
    queryFn: () => AttendanceService.byEnrollment(enrollmentId as string),
    staleTime: 30_000,
  })
}
