const baseModuleUrl = "/gradebook"

export const GradebookUrl = {
  StudentSummary: `${baseModuleUrl}/student-summary`,
  Centralizer: `${baseModuleUrl}/centralizer`,
  Attendance: `${baseModuleUrl}/attendance`,
} as const
