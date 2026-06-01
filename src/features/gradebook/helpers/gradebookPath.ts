const baseModuleUrl = "/gradebook"

export const GradebookUrl = {
  Attendance: `${baseModuleUrl}/attendance`,
  Scores: `${baseModuleUrl}/scores`,
} as const
