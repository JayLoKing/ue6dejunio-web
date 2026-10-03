const DAY_MS = 24 * 60 * 60 * 1000

/**
 * Parses a calendar day field by field. `new Date("2026-02-01")` is UTC midnight and reads as the
 * day before in a negative offset, so the day is built in UTC and only ever read back in UTC.
 */
const utcOf = (iso: string): number => {
  const [y, m, d] = iso.split("-").map(Number)
  return Date.UTC(y, m - 1, d)
}

const isoOfUtc = (ms: number): string => {
  const d = new Date(ms)
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`
}

/** Monday of the ISO week that holds `iso`; a Saturday or Sunday still belongs to the week before it. */
const mondayOf = (iso: string): number => {
  const ms = utcOf(iso)
  const sinceMonday = (new Date(ms).getUTCDay() + 6) % 7
  return ms - sinceMonday * DAY_MS
}

/**
 * The days attendance can still be corrected on: the weekdays of the current week up to and
 * including today. Mirrors the API's `requireEditableSchoolDay`, which anchors on today's ISO week,
 * so on a weekend Monday to Friday of that same week stay open. Earlier weeks and future days are
 * closed; Saturday and Sunday are never a school day.
 */
export const editableDaysOfWeek = (today: string): string[] => {
  const monday = mondayOf(today)
  const todayMs = utcOf(today)
  const days: string[] = []
  for (let i = 0; i < 5; i++) {
    const ms = monday + i * DAY_MS
    if (ms <= todayMs) days.push(isoOfUtc(ms))
  }
  return days
}

export const isEditableAttendanceDay = (iso: string, today: string): boolean =>
  editableDaysOfWeek(today).includes(iso)
