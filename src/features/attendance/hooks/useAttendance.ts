import { useMutation, useQueryClient } from "@tanstack/react-query"

import { AttendanceService } from "../services/attendanceService"
import type { DailyAttendancePayload, SessionAttendancePayload } from "../types"

export function useDailyAttendance() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (p: DailyAttendancePayload) => AttendanceService.daily(p),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["gradebook", "attendance"] })
    },
  })
}

export function useSessionAttendance() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (p: SessionAttendancePayload) => AttendanceService.session(p),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["gradebook", "attendance"] })
    },
  })
}
