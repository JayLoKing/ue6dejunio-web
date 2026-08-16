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

/** Consolidado por dimensión de una materia (GET /scores?id_course_enrollment). */
export interface EnrollmentScore {
  id: string
  courseEnrollmentId: string
  classGroupId: string
  subjectName: string
  trimester: number
  scoreBeing: number | null
  scoreKnowing: number | null
  scoreDoing: number | null
  scoreDeciding: number | null
  totalScore: number | null
  updatedAt: string | null
}

/** Conteos de asistencia. percentage = present/(present+absent+late); null si no computable. */
export interface AttendanceCounts {
  present: number
  absent: number
  late: number
  excused: number
  computableSessions: number
  percentage: number | null
}

export interface MonthlyAttendanceStat extends AttendanceCounts {
  year: number
  month: number
}

export interface TrimesterAttendanceStat extends AttendanceCounts {
  trimester: number
}

/** GET /courses/{id}/attendance-stats — % de asistencia diaria del curso. */
export interface CourseAttendanceStats {
  courseId: string
  scope: string
  trimester: number | null
  overall: AttendanceCounts
  byMonth: MonthlyAttendanceStat[]
  byTrimester: TrimesterAttendanceStat[]
}

export interface CourseAttendanceRow {
  courseEnrollmentId: string
  studentId: string
  fullName: string
  attendances: CourseAttendanceItem[]
}
