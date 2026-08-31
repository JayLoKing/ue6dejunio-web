import { describe, expect, it } from "vitest"

import { planLabel } from "./planLabel"

describe("planLabel", () => {
  it("names the plan by its number and course", () => {
    expect(planLabel({ planNumber: 4, courseName: 'Quinto "B"' })).toBe(
      'Plan Nº 4 · Quinto "B"'
    )
  })

  // A listing row is fetched without its blocks, so the course name can be absent. Printing
  // "Plan Nº 4 · " with a dangling separator would read as missing data rather than as none.
  it("drops the separator when there is no course to name", () => {
    expect(planLabel({ planNumber: 4, courseName: null })).toBe("Plan Nº 4")
    expect(planLabel({ planNumber: 4, courseName: "   " })).toBe("Plan Nº 4")
  })
})
