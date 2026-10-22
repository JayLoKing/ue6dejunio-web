import { describe, expect, it } from "vitest"

import type { PdcStatus } from "../types"
import {
  acceptsProgress,
  isCopyable,
  isEditable,
  STATUS_BADGE,
  STATUS_LABEL,
} from "./status"

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

describe("acceptsProgress", () => {
  // The API answers 409 to progress on any plan the Director has not approved, so the button only
  // belongs where the call can succeed.
  it("accepts progress only on an approved plan", () => {
    expect(acceptsProgress("Approved")).toBe(true)
    for (const status of EVERY_STATUS.filter((s) => s !== "Approved")) {
      expect(acceptsProgress(status)).toBe(false)
    }
  })
})

describe("isCopyable", () => {
  // The API copies only a plan that has left the draft: a half-written month handed to the other
  // parallels would spread the gaps, and it answers 409 to anything else.
  it("copies a published, reviewed or approved plan", () => {
    expect(isCopyable("Published")).toBe(true)
    expect(isCopyable("Under Review")).toBe(true)
    expect(isCopyable("Approved")).toBe(true)
  })

  it("refuses a draft and a plan sent back with observations", () => {
    expect(isCopyable("Draft")).toBe(false)
    expect(isCopyable("With Observations")).toBe(false)
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
