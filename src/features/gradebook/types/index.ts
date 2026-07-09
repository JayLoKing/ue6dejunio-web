export interface StudentSubjectTotal {
  classGroupId: string
  subjectName: string
  total: number
  graded: boolean
}

export interface StudentSummary {
  courseEnrollmentId: string
  studentId: string
  fullName: string
  trimester: number
  subjects: StudentSubjectTotal[]
  generalAverage: number
}

export interface CourseAttendanceItem {
  id: string
  date: string
  status: string
}

export interface CourseAttendanceRow {
  courseEnrollmentId: string
  studentId: string
  fullName: string
  attendances: CourseAttendanceItem[]
}
