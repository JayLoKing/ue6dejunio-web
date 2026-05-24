import { useMutation } from "@tanstack/react-query"

import { AttendanceService } from "../services/attendanceService"
import type { RegisterAttendanceRequest } from "../models/requests/register-attendance-request"
import type { AttendanceResponse } from "../models/response/attendance-response"

export function useRegisterAttendance() {
  return useMutation<AttendanceResponse, Error, RegisterAttendanceRequest>({
    mutationFn: (payload) => AttendanceService.register(payload),
  })
}
