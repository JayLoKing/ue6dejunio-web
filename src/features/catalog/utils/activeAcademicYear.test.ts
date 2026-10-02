import { describe, expect, it } from "vitest"

import { activeAcademicYear } from "./activeAcademicYear"

describe("activeAcademicYear", () => {
  it("picks the active year even when it is not the newest", () => {
    const years = [
      { id: 3, year: 2027, active: false, closed: false },
      { id: 2, year: 2026, active: true, closed: false },
      { id: 1, year: 2025, active: false, closed: true },
    ]

    expect(activeAcademicYear(years)).toEqual(years[1])
  })

  it("returns undefined when no year is active, never the first one", () => {
    const years = [
      { id: 2, year: 2026, active: false, closed: false },
      { id: 1, year: 2025, active: false, closed: true },
    ]

    expect(activeAcademicYear(years)).toBeUndefined()
  })

  it("returns undefined while the catalog has not loaded", () => {
    expect(activeAcademicYear(undefined)).toBeUndefined()
    expect(activeAcademicYear([])).toBeUndefined()
  })
})
