const baseModuleUrl = "/scores"

export const ScoreUrl = {
  Base: baseModuleUrl,
  ByEnrollment: (enrollmentId: string) =>
    `${baseModuleUrl}/enrollment/${enrollmentId}`,
} as const
