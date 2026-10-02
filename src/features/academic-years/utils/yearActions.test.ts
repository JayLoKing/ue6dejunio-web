import { describe, expect, it } from "vitest"

import { canActivate, canClose, canReopen } from "./yearActions"

const activeOpen = { id: 1, year: 2026, active: true, closed: false }
const open = { id: 2, year: 2027, active: false, closed: false }
const closed = { id: 3, year: 2025, active: false, closed: true }

describe("year actions", () => {
  it("activates only a year that is neither active nor closed", () => {
    expect(canActivate(open)).toBe(true)
    expect(canActivate(activeOpen)).toBe(false)
    expect(canActivate(closed)).toBe(false)
  })

  it("closes any year that is not closed yet, the active one included", () => {
    expect(canClose(open)).toBe(true)
    expect(canClose(activeOpen)).toBe(true)
    expect(canClose(closed)).toBe(false)
  })

  it("reopens only a closed year", () => {
    expect(canReopen(closed)).toBe(true)
    expect(canReopen(open)).toBe(false)
    expect(canReopen(activeOpen)).toBe(false)
  })
})
