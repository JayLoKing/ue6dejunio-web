import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { renderHook, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

const create = vi.hoisted(() => vi.fn())
const update = vi.hoisted(() => vi.fn())
const remove = vi.hoisted(() => vi.fn())
const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }))

vi.mock("../services/academicServices", () => ({
  GradeAdminService: {},
  KnowledgeAreaAdminService: {},
  LevelService: {},
  ParallelService: {},
  SubjectAdminService: { create, update, remove },
  TrimesterPeriodService: {},
}))
vi.mock("sonner", () => ({ toast }))

import {
  useCreateSubject,
  useDeleteSubject,
  useUpdateSubject,
} from "./useAcademic"

let qc: QueryClient

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={qc}>{children}</QueryClientProvider>
)

beforeEach(() => {
  vi.clearAllMocks()
  create.mockResolvedValue({})
  update.mockResolvedValue({})
  remove.mockResolvedValue(undefined)
  qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
})

describe("subject mutations keep the pickers fresh", () => {
  it.each([
    [
      "create",
      useCreateSubject,
      { name: "Física", id_area: 1, technical: false },
    ],
    [
      "update",
      useUpdateSubject,
      { id: "s1", name: "Física", id_area: 1, technical: false },
    ],
    ["delete", useDeleteSubject, "s1"],
  ] as const)(
    "%s invalidates the admin list and the catalog subjects",
    async (_name, useHook, variables) => {
      const invalidate = vi.spyOn(qc, "invalidateQueries")
      const { result } = renderHook(() => useHook(), { wrapper })

      // The three hooks take different variable shapes; the table pairs each correctly.
      ;(result.current.mutate as (v: unknown) => void)(variables)
      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      const keys = invalidate.mock.calls.map((c) => c[0]?.queryKey)
      expect(keys).toContainEqual(["subjects"])
      expect(keys).toContainEqual(["catalog", "subjects"])
    }
  )
})
