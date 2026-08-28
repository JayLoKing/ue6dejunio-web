import { describe, expect, it } from "vitest"

import { planLabel, subjectSummary } from "./planLabel"

describe("planLabel", () => {
  it("names the plan by its number and course", () => {
    expect(planLabel({ planNumber: 4, courseName: 'Quinto "B"' })).toBe(
      'Plan Nº 4 · Quinto "B"',
    )
  })

  // A listing row is fetched without its blocks, so the course name can be absent. Printing
  // "Plan Nº 4 · " with a dangling separator would read as missing data rather than as none.
  it("drops the separator when there is no course to name", () => {
    expect(planLabel({ planNumber: 4, courseName: null })).toBe("Plan Nº 4")
    expect(planLabel({ planNumber: 4, courseName: "   " })).toBe("Plan Nº 4")
  })
})

describe("subjectSummary", () => {
  const subject = (subjectName: string) =>
    ({ subjectName }) as Pdc["subjects"][number]

  it("names one or two subjects outright", () => {
    expect(subjectSummary({ subjects: [subject("Matemática")] })).toBe("Matemática")
    expect(
      subjectSummary({ subjects: [subject("Matemática"), subject("Música")] }),
    ).toBe("Matemática, Música")
  })

  // A homeroom plan spans seven subjects; listing them all would not fit a table cell.
  it("counts them once there are more than two", () => {
    expect(
      subjectSummary({
        subjects: [subject("A"), subject("B"), subject("C")],
      }),
    ).toBe("3 materias")
  })

  it("says nothing rather than an empty string when a row carries no blocks", () => {
    expect(subjectSummary({ subjects: [] })).toBe("—")
  })
})

type Pdc = import("../types").Pdc
