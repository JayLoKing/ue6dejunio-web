export interface CourseAttendanceItem {
  id: string
  date: string
  status: string
}

export interface CourseAttendanceRow {
  studentId: string
  fullName: string
  enrollmentId: string
  attendances: CourseAttendanceItem[]
}

export interface CourseScoreItem {
  id: string
  trimester: number
  scoreBeing: number
  scoreKnowing: number
  scoreDoing: number
  scoreDeciding: number
  totalScore: number
}

export interface CourseScoreRow {
  studentId: string
  fullName: string
  enrollmentId: string
  scores: CourseScoreItem[]
}
