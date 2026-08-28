import { describe, expect, it } from "vitest"

import type { PdcStatus } from "../types"
import { isEditable, STATUS_BADGE, STATUS_LABEL } from "./status"

const EVERY_STATUS: PdcStatus[] = [
  "Draft",
  "Published",
  "Under Review",
  "With Observations",
  "Approved",
]

describe("isEditable", () => {
  // A published plan is in the Director's hands. Letting the teacher keep typing into it would
  // change what is already under review.
  it("allows writing a draft and one sent back with observations", () => {
    expect(isEditable("Draft")).toBe(true)
    expect(isEditable("With Observations")).toBe(true)
  })

  it("refuses the states the Director owns", () => {
    expect(isEditable("Published")).toBe(false)
    expect(isEditable("Under Review")).toBe(false)
    expect(isEditable("Approved")).toBe(false)
  })
})

describe("status maps", () => {
  // The listing reads both maps by status with no fallback, so a missing entry renders blank.
  it("names and shades every status the API can answer with", () => {
    for (const status of EVERY_STATUS) {
      expect(STATUS_LABEL[status]).toBeTruthy()
      expect(STATUS_BADGE[status]).toBeTruthy()
    }
  })

  it("names them in Spanish", () => {
    expect(STATUS_LABEL.Draft).toBe("Borrador")
    expect(STATUS_LABEL["Under Review"]).toBe("En revisión")
  })
})
