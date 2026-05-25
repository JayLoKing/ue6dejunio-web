import { useMutation } from "@tanstack/react-query"
import { toast } from "sonner"

import { AttendanceService } from "../services/attendanceService"
import type { AttendanceBatchRequest } from "../models/requests/register-attendance-request"
import type { AttendanceBatchResult } from "../models/response/attendance-response"

export function useRegisterAttendanceBatch() {
  return useMutation<AttendanceBatchResult, Error, AttendanceBatchRequest>({
    mutationFn: (payload) => AttendanceService.registerBatch(payload),
    onSuccess: (r) =>
      toast.success(
        `Asistencia guardada: ${r.created} creadas, ${r.updated} actualizadas.`,
      ),
  })
}
