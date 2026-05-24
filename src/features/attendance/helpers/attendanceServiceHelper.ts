import type { UseApiCall } from "@/lib/useApicall"
import { loadAbort } from "@/lib/loadAbort"
import { httpClient } from "@/lib/axios"

import { AttendanceUrl } from "./attendanceServicePath"
import type {
  AttendanceBatchRequest,
  RegisterAttendanceRequest,
} from "../models/requests/register-attendance-request"
import type {
  AttendanceBatchResult,
  AttendanceResponse,
} from "../models/response/attendance-response"

export default class AttendanceServiceHelper {
  registerAsync(
    payload: RegisterAttendanceRequest,
  ): UseApiCall<AttendanceResponse> {
    const controller = loadAbort()
    return {
      call: httpClient.post<AttendanceResponse>(AttendanceUrl.Base, payload, {
        signal: controller.signal,
      }),
      controller,
    }
  }

  registerBatchAsync(
    payload: AttendanceBatchRequest,
  ): UseApiCall<AttendanceBatchResult> {
    const controller = loadAbort()
    return {
      call: httpClient.post<AttendanceBatchResult>(
        AttendanceUrl.Batch,
        payload,
        { signal: controller.signal },
      ),
      controller,
    }
  }

  byEnrollmentAsync(
    enrollmentId: string,
  ): UseApiCall<AttendanceResponse[]> {
    const controller = loadAbort()
    return {
      call: httpClient.get<AttendanceResponse[]>(
        AttendanceUrl.ByEnrollment(enrollmentId),
        { signal: controller.signal },
      ),
      controller,
    }
  }
}
