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

/** Una marca dentro de un lote. Los nombres son los que espera la API, no los de acá. */
export interface AttendanceBatchMark {
  id_course_enrollment: string
  status: AttendanceApiStatus
}

export interface DailyBatchPayload {
  date: string
  records: AttendanceBatchMark[]
}

export interface SessionBatchPayload {
  id_class_group: string
  date: string
  records: AttendanceBatchMark[]
}

/** Cuántas marcas trajo el lote y cuántas filas quedaron: iguales, salvo repetidos. */
export interface AttendanceBatchResult {
  total: number
  saved: number
}

export interface AttendanceResponse {
  id: string
  courseEnrollmentId: string
  classGroupId: string | null
  date: string
  status: AttendanceApiStatus
}
