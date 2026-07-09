import type { UseApiCall } from "@/lib/useApicall"
import { loadAbort } from "@/lib/loadAbort"
import { httpClient } from "@/lib/axios"

import { AttendanceUrl } from "./attendanceServicePath"
import type {
  AttendanceResponse,
  DailyAttendancePayload,
  SessionAttendancePayload,
} from "../types"

export default class AttendanceServiceHelper {
  dailyAsync(payload: DailyAttendancePayload): UseApiCall<AttendanceResponse> {
    const controller = loadAbort()
    return {
      call: httpClient.post<AttendanceResponse>(AttendanceUrl.Daily, payload, {
        signal: controller.signal,
      }),
      controller,
    }
  }
  sessionAsync(
    payload: SessionAttendancePayload,
  ): UseApiCall<AttendanceResponse> {
    const controller = loadAbort()
    return {
      call: httpClient.post<AttendanceResponse>(AttendanceUrl.Session, payload, {
        signal: controller.signal,
      }),
      controller,
    }
  }
  byCourseEnrollmentAsync(
    courseEnrollmentId: string,
  ): UseApiCall<AttendanceResponse[]> {
    const controller = loadAbort()
    return {
      call: httpClient.get<AttendanceResponse[]>(AttendanceUrl.Base, {
        signal: controller.signal,
        params: { id_course_enrollment: courseEnrollmentId },
      }),
      controller,
    }
  }
}
