import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { renderHook, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

const academicYears = vi.hoisted(() => vi.fn())
const list = vi.hoisted(() => vi.fn())

vi.mock("@/features/catalog/services/catalogService", () => ({
  CatalogService: { academicYears },
}))
vi.mock("../services/courseService", () => ({ CourseService: { list } }))

import { useActiveYearCourses } from "./useActiveYearCourses"

const Y2026 = { id: 1, year: 2026, active: true, closed: false }
const Y2027 = { id: 2, year: 2027, active: false, closed: false }

let qc: QueryClient

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={qc}>{children}</QueryClientProvider>
)

beforeEach(() => {
  vi.clearAllMocks()
  academicYears.mockResolvedValue([Y2027, Y2026])
  list.mockImplementation((_query: unknown, yearId: number) =>
    Promise.resolve({ content: [{ id: `c-${yearId}`, year: yearId }] })
  )
  qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
})

describe("useActiveYearCourses", () => {
  it("asks for the courses of the active year, not the newest one", async () => {
    const { result } = renderHook(() => useActiveYearCourses(), { wrapper })

    await waitFor(() => expect(result.current.data).toBeDefined())

    expect(list).toHaveBeenCalledTimes(1)
    expect(list).toHaveBeenCalledWith(expect.anything(), 1)
    expect(result.current.data?.content).toEqual([{ id: "c-1", year: 1 }])
    expect(result.current.academicYearId).toBe(1)
  })

  it("is loading while the year list is, and asks for no course meanwhile", () => {
    academicYears.mockReturnValue(new Promise(() => {}))

    const { result } = renderHook(() => useActiveYearCourses(), { wrapper })

    expect(result.current.isLoading).toBe(true)
    expect(list).not.toHaveBeenCalled()
  })

  it("is loading while the courses are", async () => {
    list.mockReturnValue(new Promise(() => {}))
    const { result } = renderHook(() => useActiveYearCourses(), { wrapper })

    await waitFor(() => expect(list).toHaveBeenCalled())

    expect(result.current.isLoading).toBe(true)
  })

  it("reports a failed year list as an error, not as no courses", async () => {
    academicYears.mockRejectedValue(new Error("boom"))
    const { result } = renderHook(() => useActiveYearCourses(), { wrapper })

    await waitFor(() => expect(result.current.isError).toBe(true))

    expect(result.current.isLoading).toBe(false)
    expect(result.current.data).toBeUndefined()
  })

  it("reports a failed course list as an error", async () => {
    list.mockRejectedValue(new Error("boom"))
    const { result } = renderHook(() => useActiveYearCourses(), { wrapper })

    await waitFor(() => expect(result.current.isError).toBe(true))
  })

  it("has no courses, and no error, when no year is active", async () => {
    academicYears.mockResolvedValue([{ ...Y2026, active: false }, Y2027])
    const { result } = renderHook(() => useActiveYearCourses(), { wrapper })

    await waitFor(() => expect(academicYears).toHaveBeenCalled())
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(list).not.toHaveBeenCalled()
    expect(result.current.data).toBeUndefined()
    expect(result.current.isError).toBe(false)
    expect(result.current.academicYearId).toBeNull()
  })
})
