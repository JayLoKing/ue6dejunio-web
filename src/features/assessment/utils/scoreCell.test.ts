import { describe, expect, it } from "vitest"

import { cellTitle, round1 } from "./scoreCell"

describe("round1", () => {
  it("keeps one decimal", () => {
    expect(round1(2.349)).toBe(2.3)
    expect(round1(2.35)).toBe(2.4)
  })

  it("leaves a whole number whole", () => {
    expect(round1(7)).toBe(7)
  })
})

describe("cellTitle", () => {
  it("has no tooltip for a cell that was never graded", () => {
    expect(cellTitle(undefined)).toBeUndefined()
  })

  it("has no tooltip when the cell carries no dates", () => {
    expect(cellTitle({ recordedAt: null, updatedAt: null })).toBeUndefined()
  })

  it("announces when the score was recorded", () => {
    const title = cellTitle({
      recordedAt: "2026-08-20T10:00:00Z",
      updatedAt: null,
    })
    expect(title).toMatch(/^registrada /)
  })

  it("announces the edit only when it differs from the original record", () => {
    const edited = cellTitle({
      recordedAt: "2026-08-20T10:00:00Z",
      updatedAt: "2026-08-22T10:00:00Z",
    })
    expect(edited).toMatch(/^registrada .+ · editada /)

    const untouched = cellTitle({
      recordedAt: "2026-08-20T10:00:00Z",
      updatedAt: "2026-08-20T18:30:00Z",
    })
    // Mismo día: para el docente no hubo edición, no vale ensuciar el tooltip.
    expect(untouched).not.toMatch(/editada/)
  })

  it("ignores a date the browser cannot read", () => {
    expect(
      cellTitle({ recordedAt: "no-es-fecha", updatedAt: null })
    ).toBeUndefined()
  })
})
