const baseModuleUrl = "/enrollments"

export const EnrollmentUrl = {
  Single: baseModuleUrl,
  Batch: `${baseModuleUrl}/batch`,
} as const
