import { describe, expect, it } from "vitest"

import { editableDaysOfWeek, isEditableAttendanceDay } from "./editableDay"

// 2026-08-24 is a Monday, so the week is 24 (Mon) .. 28 (Fri), 29 (Sat), 30 (Sun).
describe("isEditableAttendanceDay", () => {
  it("accepts Monday through today within the current week (today = Thursday)", () => {
    const today = "2026-08-27"
    expect(isEditableAttendanceDay("2026-08-24", today)).toBe(true)
    expect(isEditableAttendanceDay("2026-08-25", today)).toBe(true)
    expect(isEditableAttendanceDay("2026-08-26", today)).toBe(true)
    expect(isEditableAttendanceDay("2026-08-27", today)).toBe(true)
  })

  it("refuses a later day of the current week", () => {
    expect(isEditableAttendanceDay("2026-08-28", "2026-08-27")).toBe(false)
  })

  it("refuses last week's Friday on a Monday", () => {
    expect(isEditableAttendanceDay("2026-08-21", "2026-08-24")).toBe(false)
    expect(isEditableAttendanceDay("2026-08-24", "2026-08-24")).toBe(true)
  })

  it("keeps Monday to Friday of the same week editable on a Saturday and a Sunday", () => {
    for (const today of ["2026-08-29", "2026-08-30"]) {
      for (const day of [24, 25, 26, 27, 28]) {
        expect(isEditableAttendanceDay(`2026-08-${day}`, today)).toBe(true)
      }
      expect(isEditableAttendanceDay("2026-08-21", today)).toBe(false)
    }
  })

  it("never accepts a Saturday or a Sunday", () => {
    expect(isEditableAttendanceDay("2026-08-29", "2026-08-30")).toBe(false)
    expect(isEditableAttendanceDay("2026-08-30", "2026-08-30")).toBe(false)
  })

  it("handles a week that straddles two months", () => {
    // Mon 2026-08-31 .. Fri 2026-09-04
    expect(isEditableAttendanceDay("2026-08-31", "2026-09-02")).toBe(true)
    expect(isEditableAttendanceDay("2026-08-28", "2026-09-02")).toBe(false)
  })
})

describe("editableDaysOfWeek", () => {
  it("lists Monday through today, oldest first", () => {
    expect(editableDaysOfWeek("2026-08-26")).toEqual([
      "2026-08-24",
      "2026-08-25",
      "2026-08-26",
    ])
  })

  it("lists the whole working week on a weekend", () => {
    expect(editableDaysOfWeek("2026-08-30")).toHaveLength(5)
  })
})
