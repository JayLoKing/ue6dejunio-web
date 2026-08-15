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

export interface CourseAttendanceRow {
  courseEnrollmentId: string
  studentId: string
  fullName: string
  attendances: CourseAttendanceItem[]
}
