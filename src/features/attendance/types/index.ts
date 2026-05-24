export type AttendanceApiStatus = "Present" | "Absent" | "Excused" | "Late"

export type AttendanceCellStatus = "P" | "A" | "L" | null

export const CELL_TO_API: Record<Exclude<AttendanceCellStatus, null>, AttendanceApiStatus> = {
  P: "Present",
  A: "Absent",
  L: "Excused",
}

export const API_TO_CELL: Record<AttendanceApiStatus, AttendanceCellStatus> = {
  Present: "P",
  Absent: "A",
  Excused: "L",
  Late: "A",
}

export const nextStatus = (
  current: AttendanceCellStatus,
): Exclude<AttendanceCellStatus, null> => {
  switch (current) {
    case null:
      return "P"
    case "P":
      return "A"
    case "A":
      return "L"
    case "L":
      return "P"
  }
}

export interface StudentEnrollmentRow {
  enrollmentId: string
  studentId: string
  fullName: string
  rudeCode: string
}
