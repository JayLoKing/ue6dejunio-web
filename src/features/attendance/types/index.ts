export type AttendanceApiStatus = "Present" | "Absent" | "Excused" | "Late"

export type AttendanceCellStatus = "P" | "A" | "L" | null

export interface DailyAttendancePayload {
  id_course_enrollment: string
  date: string
  status: AttendanceApiStatus
}

export interface SessionAttendancePayload {
  id_course_enrollment: string
  id_class_group: string
  date: string
  status: AttendanceApiStatus
}

export interface AttendanceResponse {
  id: string
  courseEnrollmentId: string
  classGroupId: string | null
  date: string
  status: AttendanceApiStatus
}
