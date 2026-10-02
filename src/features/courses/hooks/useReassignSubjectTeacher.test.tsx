import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { renderHook, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

const reassign = vi.hoisted(() => vi.fn())

vi.mock("../services/courseService", () => ({
  CourseService: { reassignSubjectTeacher: reassign },
}))

const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }))
vi.mock("sonner", () => ({ toast }))

import { useReassignSubjectTeacher } from "./useCourses"

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

describe("useReassignSubjectTeacher", () => {
  it("sends the course, the class group and the teacher, then says so and refreshes the course views", async () => {
    reassign.mockResolvedValue({})
    const invalidate = vi.spyOn(qc, "invalidateQueries")

    const { result } = renderHook(() => useReassignSubjectTeacher(), {
      wrapper,
    })
    result.current.mutate({
      courseId: "course-1",
      classGroupId: "cg-1",
      teacherId: "t-9",
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(reassign).toHaveBeenCalledWith("course-1", "cg-1", "t-9")
    expect(toast.success).toHaveBeenCalled()
    const invalidated = invalidate.mock.calls.map((c) => c[0]?.queryKey)
    for (const key of [["courses"], ["course-overview"], ["teacher"]]) {
      expect(invalidated).toContainEqual(key)
    }
  })

  it("neither toasts success nor invalidates when the API refuses", async () => {
    reassign.mockRejectedValue(new Error("409"))
    const invalidate = vi.spyOn(qc, "invalidateQueries")

    const { result } = renderHook(() => useReassignSubjectTeacher(), {
      wrapper,
    })
    result.current.mutate({
      courseId: "course-1",
      classGroupId: "cg-1",
      teacherId: "t-9",
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(toast.success).not.toHaveBeenCalled()
    expect(invalidate).not.toHaveBeenCalled()
  })
})
