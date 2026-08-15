const baseModuleUrl = "/gradebook"

export const GradebookUrl = {
  StudentSummary: `${baseModuleUrl}/student-summary`,
  Centralizer: `${baseModuleUrl}/centralizer`,
  Attendance: `${baseModuleUrl}/attendance`,
} as const

// Consolidado por dimensión (fuera del prefijo /gradebook).
export const ScoreUrl = {
  Base: "/scores",
} as const
