import { describe, expect, it } from "vitest"

import { isValidDisplayOrder, toDisplayOrder } from "./displayOrder"

describe("isValidDisplayOrder", () => {
  /** Blank is an answer: it hands the decision to the API rather than being a missing field. */
  it("accepts a blank field", () => {
    expect(isValidDisplayOrder("")).toBe(true)
    expect(isValidDisplayOrder("   ")).toBe(true)
  })

  it("accepts a whole position", () => {
    expect(isValidDisplayOrder("1")).toBe(true)
    expect(isValidDisplayOrder("12")).toBe(true)
    expect(isValidDisplayOrder("  3  ")).toBe(true)
  })

  /**
   * The one a "one or more" check lets through. A position in a list has no halves, and the column
   * behind it holds integers, so 1.5 would arrive truncated and land somewhere nobody chose.
   */
  it("rejects a fraction", () => {
    expect(isValidDisplayOrder("1.5")).toBe(false)
    expect(isValidDisplayOrder("2.0001")).toBe(false)
  })

  it("rejects zero and negatives, which are not positions", () => {
    expect(isValidDisplayOrder("0")).toBe(false)
    expect(isValidDisplayOrder("-1")).toBe(false)
  })

  it("rejects what is not a number at all", () => {
    expect(isValidDisplayOrder("abc")).toBe(false)
    expect(isValidDisplayOrder("1a")).toBe(false)
  })

  /** Number("1e400") is Infinity, which is an integer to nobody but IEEE 754. */
  it("rejects a number too large to be one", () => {
    expect(isValidDisplayOrder("1e400")).toBe(false)
  })
})

describe("toDisplayOrder", () => {
  it("leaves a blank field out rather than sending a zero", () => {
    expect(toDisplayOrder("")).toBeUndefined()
    expect(toDisplayOrder("   ")).toBeUndefined()
  })

  it("sends what was typed, as a number", () => {
    expect(toDisplayOrder("3")).toBe(3)
    expect(toDisplayOrder(" 4 ")).toBe(4)
  })
})
