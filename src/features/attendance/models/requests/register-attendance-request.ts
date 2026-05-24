import type { AttendanceApiStatus } from "../../types"

export interface RegisterAttendanceRequest {
  id_enrollment: string
  date: string
  status: AttendanceApiStatus
}

export interface AttendanceBatchRecord {
  enrollmentId: string
  status: AttendanceApiStatus
}

export interface AttendanceBatchRequest {
  date: string
  records: AttendanceBatchRecord[]
}
