import AttendanceServiceHelper from "../helpers/attendanceServiceHelper"
import type {
  AttendanceBatchRequest,
  RegisterAttendanceRequest,
} from "../models/requests/register-attendance-request"
import type {
  AttendanceBatchResult,
  AttendanceResponse,
} from "../models/response/attendance-response"

const helper = new AttendanceServiceHelper()

export class AttendanceService {
  static async register(
    payload: RegisterAttendanceRequest,
  ): Promise<AttendanceResponse> {
    const { call } = helper.registerAsync(payload)
    const response = await call
    return response.data
  }

  static async registerBatch(
    payload: AttendanceBatchRequest,
  ): Promise<AttendanceBatchResult> {
    const { call } = helper.registerBatchAsync(payload)
    const response = await call
    return response.data
  }

  static async byEnrollment(
    enrollmentId: string,
  ): Promise<AttendanceResponse[]> {
    const { call } = helper.byEnrollmentAsync(enrollmentId)
    const response = await call
    return response.data
  }
}
