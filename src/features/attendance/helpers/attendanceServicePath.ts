const baseModuleUrl = "/attendance"

export const AttendanceUrl = {
  Base: baseModuleUrl,
  Batch: `${baseModuleUrl}/batch`,
  ByEnrollment: (enrollmentId: string) =>
    `${baseModuleUrl}/enrollment/${enrollmentId}`,
} as const
