import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { renderHook, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

const activate = vi.hoisted(() => vi.fn())
const close = vi.hoisted(() => vi.fn())
const reopen = vi.hoisted(() => vi.fn())
const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }))

vi.mock("../services/academicYearService", () => ({
  AcademicYearService: { activate, close, reopen },
}))
vi.mock("sonner", () => ({ toast }))

import {
  useActivateAcademicYear,
  useCloseAcademicYear,
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
