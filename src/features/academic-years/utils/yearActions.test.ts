import { describe, expect, it } from "vitest"

import {
  canActivate,
  canClose,
  canDuplicate,
  canReopen,
  defaultSourceYear,
} from "./yearActions"

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

describe("duplicating a structure", () => {
  it("only into a year that is still open", () => {
    expect(canDuplicate(open)).toBe(true)
    expect(canDuplicate(activeOpen)).toBe(true)
    expect(canDuplicate(closed)).toBe(false)
  })
})

describe("defaultSourceYear", () => {
  it("prefers the active year when it is not the target", () => {
    expect(defaultSourceYear([open, activeOpen, closed], open)?.id).toBe(1)
  })

  it("falls back to the newest other year when the target is the active one", () => {
    expect(defaultSourceYear([open, activeOpen, closed], activeOpen)?.id).toBe(
      2
    )
  })

  it("falls back to the newest other year when no year is active", () => {
    const older = { ...closed, id: 4, year: 2024 }
    expect(defaultSourceYear([older, closed, open], open)?.id).toBe(3)
  })

  it("is undefined when the target is the only year", () => {
    expect(defaultSourceYear([open], open)).toBeUndefined()
    expect(defaultSourceYear(undefined, open)).toBeUndefined()
  })
})
