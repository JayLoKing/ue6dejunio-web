const baseModuleUrl = "/attendance"

export const AttendanceUrl = {
  Daily: `${baseModuleUrl}/daily`,
  DailyBatch: `${baseModuleUrl}/daily/batch`,
  Session: `${baseModuleUrl}/session`,
  SessionBatch: `${baseModuleUrl}/session/batch`,
  Base: baseModuleUrl,
} as const
