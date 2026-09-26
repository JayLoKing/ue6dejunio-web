import type { UseApiCall } from "@/lib/useApicall"
import { loadAbort } from "@/lib/loadAbort"
import { httpClient } from "@/lib/axios"

import { AttendanceUrl } from "./attendanceServicePath"
import type {
  AttendanceBatchResult,
  AttendanceResponse,
  DailyAttendancePayload,
  DailyBatchPayload,
  SessionAttendancePayload,
  SessionBatchPayload,
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
    payload: SessionAttendancePayload
  ): UseApiCall<AttendanceResponse> {
    const controller = loadAbort()
    return {
      call: httpClient.post<AttendanceResponse>(
        AttendanceUrl.Session,
        payload,
        {
          signal: controller.signal,
        }
      ),
      controller,
    }
  }
  /**
   * El curso entero en una llamada.
   *
   * Marcar treinta estudiantes de a uno son treinta peticiones, treinta transacciones y treinta
   * oportunidades de que la número diecisiete falle y deje la lista a medias. El lote es una sola
   * transacción: entra completo o no entra nada.
   */
  dailyBatchAsync(
    payload: DailyBatchPayload
  ): UseApiCall<AttendanceBatchResult> {
    const controller = loadAbort()
    return {
      call: httpClient.post<AttendanceBatchResult>(
        AttendanceUrl.DailyBatch,
        payload,
        { signal: controller.signal }
      ),
      controller,
    }
  }
  sessionBatchAsync(
    payload: SessionBatchPayload
  ): UseApiCall<AttendanceBatchResult> {
    const controller = loadAbort()
    return {
      call: httpClient.post<AttendanceBatchResult>(
        AttendanceUrl.SessionBatch,
        payload,
        { signal: controller.signal }
      ),
      controller,
    }
  }
  byCourseEnrollmentAsync(
    courseEnrollmentId: string
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
