import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { renderHook, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

const activate = vi.hoisted(() => vi.fn())
const close = vi.hoisted(() => vi.fn())
const reopen = vi.hoisted(() => vi.fn())
const create = vi.hoisted(() => vi.fn())
const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }))

vi.mock("../services/academicYearService", () => ({
  AcademicYearService: { activate, close, reopen, create },
}))
vi.mock("sonner", () => ({ toast }))

import {
  useActivateAcademicYear,
  useCloseAcademicYear,
  useCreateAcademicYear,
  useReopenAcademicYear,
} from "./useAcademicYearMutations"

let qc: QueryClient

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={qc}>{children}</QueryClientProvider>
)

/** Everything keyed on "the current year" or mirroring a year field goes stale on any change. */
const STALE_AFTER_A_YEAR_CHANGE = [
  ["catalog", "academic-years"],
  ["catalog", "trimesters"],
  ["students", "movement-summary"],
  ["courses"],
  ["course-overview"],
]

const item = { id: 3, year: 2026, active: true, closed: false }

beforeEach(() => {
  vi.clearAllMocks()
  activate.mockResolvedValue(item)
  close.mockResolvedValue(item)
  reopen.mockResolvedValue(item)
  qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
})

const cases = [
  ["activate", useActivateAcademicYear, activate],
  ["close", useCloseAcademicYear, close],
  ["reopen", useReopenAcademicYear, reopen],
] as const

describe.each(cases)("%s", (_name, useHook, service) => {
  it("calls the service with the year id and invalidates what the change leaves stale", async () => {
    const invalidate = vi.spyOn(qc, "invalidateQueries")
    const { result } = renderHook(() => useHook(), { wrapper })

    result.current.mutate(3)
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(service).toHaveBeenCalledWith(3)
    expect(toast.success).toHaveBeenCalledTimes(1)
    const invalidated = invalidate.mock.calls.map((c) => c[0]?.queryKey)
    for (const key of STALE_AFTER_A_YEAR_CHANGE) {
      expect(invalidated).toContainEqual(expect.arrayContaining(key))
    }
  })

  it("invalidates nothing and does not celebrate when the API refuses", async () => {
    service.mockRejectedValue(new Error("409"))
    const invalidate = vi.spyOn(qc, "invalidateQueries")
    const { result } = renderHook(() => useHook(), { wrapper })

    result.current.mutate(3)
    await waitFor(() => expect(result.current.isError).toBe(true))

    expect(invalidate).not.toHaveBeenCalled()
    expect(toast.success).not.toHaveBeenCalled()
  })
})

describe("useCreateAcademicYear", () => {
  const created = { year: { ...item, id: 9, year: 2027 }, created: true }

  it("creates the year, says so, and refreshes the year list", async () => {
    create.mockResolvedValue(created)
    const invalidate = vi.spyOn(qc, "invalidateQueries")
    const { result } = renderHook(() => useCreateAcademicYear(), { wrapper })

    result.current.mutate(2027)
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(create).toHaveBeenCalledWith(2027)
    expect(toast.success).toHaveBeenCalledWith(
      expect.stringMatching(/2027.*creada/i)
    )
    expect(invalidate.mock.calls.map((c) => c[0]?.queryKey)).toContainEqual([
      "catalog",
      "academic-years",
    ])
  })

  it("says the year already existed instead of claiming it created one", async () => {
    create.mockResolvedValue({ ...created, created: false })
    const { result } = renderHook(() => useCreateAcademicYear(), { wrapper })

    result.current.mutate(2027)
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(toast.success).toHaveBeenCalledWith(
      expect.stringMatching(/2027.*ya existía/i)
    )
    expect(toast.success).not.toHaveBeenCalledWith(
      expect.stringMatching(/creada/i)
    )
  })

  it("celebrates nothing when the API refuses", async () => {
    create.mockRejectedValue(new Error("400"))
    const invalidate = vi.spyOn(qc, "invalidateQueries")
    const { result } = renderHook(() => useCreateAcademicYear(), { wrapper })

    result.current.mutate(2027)
    await waitFor(() => expect(result.current.isError).toBe(true))

    expect(toast.success).not.toHaveBeenCalled()
    expect(invalidate).not.toHaveBeenCalled()
  })
})
