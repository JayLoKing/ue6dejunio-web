const baseModuleUrl = "/gradebook"

export const GradebookUrl = {
  StudentSummary: `${baseModuleUrl}/student-summary`,
  Centralizer: `${baseModuleUrl}/centralizer`,
  AnnualCentralizer: `${baseModuleUrl}/annual-centralizer`,
  Attendance: `${baseModuleUrl}/attendance`,
} as const

// Consolidado por dimensión (fuera del prefijo /gradebook).
export const ScoreUrl = {
  Base: "/scores",
} as const

// Estadísticas de asistencia (endpoint bajo /courses).
export const CourseStatsUrl = {
  AttendanceStats: (courseId: string) =>
    `/courses/${courseId}/attendance-stats`,
} as const
