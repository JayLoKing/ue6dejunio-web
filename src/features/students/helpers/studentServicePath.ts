const baseModuleUrl = "/course-enrollments"

export const EnrollmentUrl = {
  Single: baseModuleUrl,
  Sync: `${baseModuleUrl}/sync`,
} as const

const studentsModuleUrl = "/students"

export const StudentUrl = {
  ById: (id: string) => `${studentsModuleUrl}/${id}`,
  Withdraw: (id: string) => `${studentsModuleUrl}/${id}/withdraw`,
} as const
