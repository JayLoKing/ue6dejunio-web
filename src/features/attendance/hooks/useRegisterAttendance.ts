import { useMutation, useQueryClient } from "@tanstack/react-query"

import { AttendanceService } from "../services/attendanceService"
import type { RegisterAttendanceRequest } from "../models/requests/register-attendance-request"
import type { AttendanceResponse } from "../models/response/attendance-response"

export function useRegisterAttendance() {
  const qc = useQueryClient()
  return useMutation<AttendanceResponse, Error, RegisterAttendanceRequest>({
    mutationFn: (payload) => AttendanceService.register(payload),
    onSuccess: (_data, vars) => {
      void qc.invalidateQueries({
        queryKey: ["attendance", "enrollment", vars.id_enrollment],
      })
    },
  })
}
