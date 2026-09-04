const baseModuleUrl = "/course-enrollments"

export const EnrollmentUrl = {
  Single: baseModuleUrl,
  Sync: `${baseModuleUrl}/sync`,
} as const

const studentsModuleUrl = "/students"

export const StudentUrl = {
  ById: (id: string) => `${studentsModuleUrl}/${id}`,
} as const
