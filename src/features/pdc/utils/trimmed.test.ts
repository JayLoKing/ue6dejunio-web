import { describe, expect, it } from "vitest"

import { trimmed } from "./trimmed"

describe("trimmed", () => {
  it("keeps what was typed, without its surrounding space", () => {
    expect(trimmed("  Objetivo del mes  ")).toBe("Objetivo del mes")
  })

  // Absent and empty are different answers to the API: absent leaves the stored value alone,
  // an empty string overwrites it. A box the teacher never filled must send nothing.
  it("drops a box that holds nothing but space", () => {
    expect(trimmed("")).toBeUndefined()
    expect(trimmed("   ")).toBeUndefined()
  })
})
