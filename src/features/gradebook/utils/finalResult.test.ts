import { describe, expect, it } from "vitest"

import {
  finalResultLabel,
  frozenResultLabel,
  hasFrozenRows,
} from "./finalResult"

describe("finalResultLabel", () => {
  it("names an approved year", () => {
    expect(finalResultLabel("APPROVED")).toBe("APROBADO")
  })

  it("names a failed year", () => {
    expect(finalResultLabel("FAILED")).toBe("REPROBADO")
  })

  // A null on a frozen row is a withdrawn student or one with no marks: no result, not a failure.
  it("has no label when there is no result", () => {
    expect(finalResultLabel(null)).toBeNull()
  })
})

describe("hasFrozenRows", () => {
  it("is true when any row comes from a closed year", () => {
    expect(hasFrozenRows([{ frozen: false }, { frozen: true }])).toBe(true)
  })

  it("is false for an open year and for no rows", () => {
    expect(hasFrozenRows([{ frozen: false }])).toBe(false)
    expect(hasFrozenRows([])).toBe(false)
  })
})

describe("frozenResultLabel", () => {
  it("labels the result only when the year is closed", () => {
    expect(frozenResultLabel({ frozen: true, finalResult: "FAILED" })).toBe(
      "REPROBADO"
    )
    expect(
      frozenResultLabel({ frozen: false, finalResult: "FAILED" })
    ).toBeNull()
    expect(frozenResultLabel({ frozen: true, finalResult: null })).toBeNull()
  })
})
