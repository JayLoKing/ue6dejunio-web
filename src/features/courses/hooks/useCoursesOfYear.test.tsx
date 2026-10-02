import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { renderHook, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

const list = vi.hoisted(() => vi.fn())

vi.mock("../services/courseService", () => ({ CourseService: { list } }))

import { useCoursesOfYear } from "./useCourses"

let qc: QueryClient

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={qc}>{children}</QueryClientProvider>
)

beforeEach(() => {
  vi.clearAllMocks()
  list.mockResolvedValue({ content: [] })
  qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
})

describe("useCoursesOfYear", () => {
  it("asks the API for the courses of that year only", async () => {
    const { result } = renderHook(() => useCoursesOfYear(2), { wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(list).toHaveBeenCalledWith(expect.anything(), 2)
  })

  it("keeps one cache entry per year and refetches on switch", async () => {
    const { result, rerender } = renderHook(
      ({ id }: { id: number }) => useCoursesOfYear(id),
      { wrapper, initialProps: { id: 2 } }
    )
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    rerender({ id: 3 })
    await waitFor(() => expect(list).toHaveBeenCalledTimes(2))
    expect(list).toHaveBeenLastCalledWith(expect.anything(), 3)
    expect(qc.getQueryCache().findAll({ queryKey: ["courses"] })).toHaveLength(
      2
    )
  })

  it("does not fetch while there is no year", () => {
    renderHook(() => useCoursesOfYear(null), { wrapper })
    expect(list).not.toHaveBeenCalled()
  })
})
