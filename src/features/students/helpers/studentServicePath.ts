const baseModuleUrl = "/course-enrollments"

export const EnrollmentUrl = {
  Single: baseModuleUrl,
  Sync: `${baseModuleUrl}/sync`,
} as const
