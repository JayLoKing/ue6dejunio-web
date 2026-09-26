import AttendanceServiceHelper from "../helpers/attendanceServiceHelper"
import type {
  AttendanceBatchResult,
  AttendanceResponse,
  DailyAttendancePayload,
  DailyBatchPayload,
  SessionAttendancePayload,
  SessionBatchPayload,
} from "../types"

const helper = new AttendanceServiceHelper()

export class AttendanceService {
  static async daily(
    payload: DailyAttendancePayload
  ): Promise<AttendanceResponse> {
    return (await helper.dailyAsync(payload).call).data
  }
  static async session(
    payload: SessionAttendancePayload
  ): Promise<AttendanceResponse> {
    return (await helper.sessionAsync(payload).call).data
  }
  static async dailyBatch(
    payload: DailyBatchPayload
  ): Promise<AttendanceBatchResult> {
    return (await helper.dailyBatchAsync(payload).call).data
  }
  static async sessionBatch(
    payload: SessionBatchPayload
  ): Promise<AttendanceBatchResult> {
    return (await helper.sessionBatchAsync(payload).call).data
  }
  static async byCourseEnrollment(
    courseEnrollmentId: string
  ): Promise<AttendanceResponse[]> {
    return (await helper.byCourseEnrollmentAsync(courseEnrollmentId).call).data
  }
}
