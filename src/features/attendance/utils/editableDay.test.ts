import { describe, expect, it } from "vitest"

import { isEditableAttendanceDay } from "./editableDay"

// 2026-08-24 is a Monday, so the week is 24 (Mon) .. 28 (Fri), 29 (Sat), 30 (Sun).
describe("isEditableAttendanceDay", () => {
  it("accepts today on a weekday", () => {
    expect(isEditableAttendanceDay("2026-08-27", "2026-08-27")).toBe(true)
    expect(isEditableAttendanceDay("2026-08-24", "2026-08-24")).toBe(true)
  })

  it("refuses an earlier day of the same week", () => {
    const today = "2026-08-27"
    for (const day of [24, 25, 26]) {
      expect(isEditableAttendanceDay(`2026-08-${day}`, today)).toBe(false)
    }
  })

  it("refuses a later day", () => {
    expect(isEditableAttendanceDay("2026-08-28", "2026-08-27")).toBe(false)
  })

  it("refuses last week's Friday on a Monday", () => {
    expect(isEditableAttendanceDay("2026-08-21", "2026-08-24")).toBe(false)
  })

  it("opens nothing on a Saturday or a Sunday, not even that week's Friday", () => {
    for (const today of ["2026-08-29", "2026-08-30"]) {
      expect(isEditableAttendanceDay("2026-08-28", today)).toBe(false)
      expect(isEditableAttendanceDay(today, today)).toBe(false)
    }
  })
})
