import type { AttendanceApiStatus } from "../../types"

export interface AttendanceResponse {
  id: string
  enrollmentId: string
  date: string
  status: AttendanceApiStatus
}

export interface AttendanceBatchResult {
  total: number
  created: number
  updated: number
  failed: number
}
