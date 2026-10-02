import { describe, expect, it } from "vitest"

import { suggestNextYear, yearInputError } from "./newYear"

const year = (y: number) => ({ id: y, year: y, active: false, closed: false })

describe("suggestNextYear", () => {
  it("proposes the year after the latest one, wherever it sits in the list", () => {
    expect(suggestNextYear([year(2026), year(2028), year(2025)], 2026)).toBe(
      2029
    )
  })

  it("falls back to the calendar year when there are no years yet", () => {
    expect(suggestNextYear([], 2026)).toBe(2026)
    expect(suggestNextYear(undefined, 2026)).toBe(2026)
  })
})

describe("yearInputError", () => {
  it("accepts a whole year inside 2000-2100, bounds included", () => {
    for (const ok of ["2000", "2027", "2100", " 2027 "]) {
      expect(yearInputError(ok)).toBeNull()
    }
  })

  it("refuses an empty field", () => {
    expect(yearInputError("")).not.toBeNull()
    expect(yearInputError("   ")).not.toBeNull()
  })

  it("refuses anything that is not a whole number", () => {
    for (const bad of ["abc", "2027.5", "20e3", "-2027"]) {
      expect(yearInputError(bad)).not.toBeNull()
    }
  })

  it("refuses a year outside 2000-2100", () => {
    expect(yearInputError("1999")).toMatch(/2000/)
    expect(yearInputError("2101")).toMatch(/2100/)
  })
})
