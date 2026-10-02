import { act, renderHook } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { useSelectedAcademicYear } from "./useSelectedAcademicYear"

const y2025 = { id: 1, year: 2025, active: false, closed: true }
const y2026 = { id: 2, year: 2026, active: true, closed: false }
const y2027 = { id: 3, year: 2027, active: false, closed: false }

describe("useSelectedAcademicYear", () => {
  it("defaults to the active year even when it is not first", () => {
    const { result } = renderHook(() =>
      useSelectedAcademicYear([y2025, y2026, y2027])
    )
    expect(result.current.academicYearId).toBe(2)
    expect(result.current.selectedYear).toEqual(y2026)
  })

  it("follows the pick and exposes whether that year is closed", () => {
    const { result } = renderHook(() =>
      useSelectedAcademicYear([y2025, y2026, y2027])
    )
    act(() => result.current.choose(1))
    expect(result.current.academicYearId).toBe(1)
    expect(result.current.selectedYear?.closed).toBe(true)
  })

  it("has no year, and does not fall to the first one, when none is active", () => {
    const { result } = renderHook(() => useSelectedAcademicYear([y2025, y2027]))
    expect(result.current.academicYearId).toBeNull()
    expect(result.current.selectedYear).toBeUndefined()
  })

  it("has no year while the list is not loaded", () => {
    const { result } = renderHook(() => useSelectedAcademicYear(undefined))
    expect(result.current.academicYearId).toBeNull()
  })
})
