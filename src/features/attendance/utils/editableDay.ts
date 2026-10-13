/**
 * Parses a calendar day field by field. `new Date("2026-02-01")` is UTC midnight and reads as the
 * day before in a negative offset, so the day is built in UTC and only ever read back in UTC.
 */
const isWeekend = (iso: string): boolean => {
  const [y, m, d] = iso.split("-").map(Number)
  const day = new Date(Date.UTC(y, m - 1, d)).getUTCDay()
  return day === 0 || day === 6
}

/**
 * Attendance is written and corrected only on the day it describes. Mirrors the API's
 * `requireEditableSchoolDay`: earlier days are frozen because they feed regularity reporting,
 * future days have not happened, and a Saturday or Sunday is never a school day — so a weekend
 * opens nothing, not even that week's Friday.
 */
export const isEditableAttendanceDay = (iso: string, today: string): boolean =>
  iso === today && !isWeekend(iso)
