import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { renderHook, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

const remove = vi.hoisted(() => vi.fn())

vi.mock("../services/courseService", () => ({
  CourseService: { remove },
}))

const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }))
vi.mock("sonner", () => ({ toast }))

import { useDeactivateCourse } from "./useCourses"

let qc: QueryClient

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={qc}>{children}</QueryClientProvider>
)

beforeEach(() => {
  vi.clearAllMocks()
  qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
})

describe("useDeactivateCourse", () => {
  it("says the course was erased when the API deleted it, and refreshes the courses", async () => {
    remove.mockResolvedValue({ outcome: "DELETED" })
    const invalidate = vi.spyOn(qc, "invalidateQueries")

    const { result } = renderHook(() => useDeactivateCourse(), { wrapper })
    result.current.mutate("course-1")

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(remove).toHaveBeenCalledWith("course-1")
    expect(toast.success).toHaveBeenCalledWith("Curso eliminado.")
    const invalidated = invalidate.mock.calls.map((c) => c[0]?.queryKey)
    expect(invalidated).toContainEqual(["courses"])
  })

  it("says the course was deactivated when the API kept it", async () => {
    remove.mockResolvedValue({ outcome: "DEACTIVATED" })

    const { result } = renderHook(() => useDeactivateCourse(), { wrapper })
    result.current.mutate("course-1")

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(toast.success).toHaveBeenCalledWith("Curso dado de baja.")
  })

  it("neither toasts success nor invalidates when the API refuses", async () => {
    remove.mockRejectedValue(new Error("409"))
    const invalidate = vi.spyOn(qc, "invalidateQueries")

    const { result } = renderHook(() => useDeactivateCourse(), { wrapper })
    result.current.mutate("course-1")

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(toast.success).not.toHaveBeenCalled()
    expect(invalidate).not.toHaveBeenCalled()
  })
})
