import { describe, expect, it } from "vitest"

import {
  annualSituationOf,
  finalResultLabel,
  frozenResultLabel,
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

describe("annualSituationOf", () => {
  const open = (finalAverage: number | null) => ({
    finalAverage,
    finalResult: null,
    frozen: false,
  })

  it("in an open year follows the mark the report card prints", () => {
    expect(annualSituationOf(open(50.49))).toBe("REPROBADO")
    expect(annualSituationOf(open(50.5))).toBe("APROBADO")
    expect(annualSituationOf(open(50.6))).toBe("APROBADO")
  })

  it("has no situation without an average", () => {
    expect(annualSituationOf(open(null))).toBeNull()
  })

  // El congelado manda: la API decidió al cerrar, y la pantalla no lo recalcula.
  it("in a closed year the frozen result overrides the computed one", () => {
    expect(
      annualSituationOf({
        finalAverage: 60,
        finalResult: "FAILED",
        frozen: true,
      })
    ).toBe("REPROBADO")
    expect(
      annualSituationOf({
        finalAverage: 40,
        finalResult: "APPROVED",
        frozen: true,
      })
    ).toBe("APROBADO")
  })

  it("has no situation for a frozen row without a result", () => {
    expect(
      annualSituationOf({ finalAverage: 60, finalResult: null, frozen: true })
    ).toBeNull()
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
