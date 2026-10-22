import { afterEach, describe, expect, it, vi } from "vitest"

import { currentTrimester } from "./currentTrimester"

const T = [
  { id: "t1", trimester: 1, startDate: "2026-02-02", endDate: "2026-05-08" },
  { id: "t2", trimester: 2, startDate: "2026-05-11", endDate: "2026-08-28" },
  { id: "t3", trimester: 3, startDate: "2026-09-07", endDate: "2026-12-04" },
]

// Local dates on purpose: `new Date("2026-05-11")` is UTC midnight, the 10th west of Greenwich.
const on = (y: number, m: number, d: number) => new Date(y, m - 1, d)

describe("currentTrimester", () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it("picks the trimester whose range holds today, both ends included", () => {
    expect(currentTrimester(T, on(2026, 2, 2))).toBe(1)
    expect(currentTrimester(T, on(2026, 5, 11))).toBe(2)
    expect(currentTrimester(T, on(2026, 7, 15))).toBe(2)
    expect(currentTrimester(T, on(2026, 8, 28))).toBe(2)
    expect(currentTrimester(T, on(2026, 12, 4))).toBe(3)
  })

  it("keeps the trimester that last started during a break between ranges", () => {
    expect(currentTrimester(T, on(2026, 5, 9))).toBe(1)
    expect(currentTrimester(T, on(2026, 9, 1))).toBe(2)
  })

  it("stays on the last trimester after the year's classes end", () => {
    expect(currentTrimester(T, on(2026, 12, 20))).toBe(3)
  })

  it("falls back to the first before classes start or without a calendar", () => {
    expect(currentTrimester(T, on(2026, 1, 15))).toBe(1)
    expect(currentTrimester([], on(2026, 7, 15))).toBe(1)
    expect(currentTrimester(undefined, on(2026, 7, 15))).toBe(1)
  })

  it("does not depend on the order the catalog answers in", () => {
    expect(currentTrimester([...T].reverse(), on(2026, 9, 1))).toBe(2)
  })

  it("reads today from the local clock when no date is given", () => {
    vi.useFakeTimers({ toFake: ["Date"] })
    vi.setSystemTime(on(2026, 10, 22))

    expect(currentTrimester(T)).toBe(3)
  })
})
