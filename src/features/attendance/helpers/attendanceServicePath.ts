const baseModuleUrl = "/attendance"

export const AttendanceUrl = {
  Daily: `${baseModuleUrl}/daily`,
  DailyBatch: `${baseModuleUrl}/daily/batch`,
  Session: `${baseModuleUrl}/session`,
  Base: baseModuleUrl,
} as const
