import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { renderHook, waitFor } from "@testing-library/react"
import type { ReactNode } from "react"
import { beforeEach, describe, expect, it, vi } from "vitest"

const toast = vi.hoisted(() => ({
  success: vi.fn(),
  warning: vi.fn(),
}))
const enrollSingle = vi.hoisted(() => vi.fn())

vi.mock("sonner", () => ({ toast }))
vi.mock("../services/studentService", () => ({
  StudentService: { enrollSingle },
}))

import { useEnrollSingle } from "./useEnroll"
import type { EnrollResponse } from "../models/response/enroll-response"

const result = (over: Partial<EnrollResponse> = {}): EnrollResponse => ({
  studentsTotal: 1,
  studentsCreated: 0,
  studentsExisting: 1,
  studentsFromPreviousYear: 0,
  studentsReentering: 0,
  enrollmentsCreated: 1,
  enrollmentsSkipped: 0,
  reinstated: [],
  skippedWithdrawn: [],
  skippedOtherCourse: [],
  conflicts: [],
  ...over,
})

const run = async () => {
  const qc = new QueryClient()
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  )
  const { result: hook } = renderHook(() => useEnrollSingle(), { wrapper })
  hook.current.mutate({ id_course: "c-1", student: {} as never })
  await waitFor(() => expect(hook.current.isSuccess).toBe(true))
}

beforeEach(() => vi.clearAllMocks())

describe("useEnrollSingle", () => {
  it("confirms the enrolment when the student was enrolled", async () => {
    enrollSingle.mockResolvedValueOnce(result())

    await run()

    expect(toast.success).toHaveBeenCalledOnce()
    expect(toast.warning).not.toHaveBeenCalled()
  })

  /** Saying "Estudiante inscrito" about someone who was skipped would be false. */
  it("says the student was not enrolled because they are withdrawn", async () => {
    enrollSingle.mockResolvedValueOnce(
      result({
        enrollmentsCreated: 0,
        skippedWithdrawn: [{ studentId: "s-1", fullName: "Ana Quispe" }],
      })
    )

    await run()

    expect(toast.success).not.toHaveBeenCalled()
    expect(toast.warning).toHaveBeenCalledWith(
      expect.stringMatching(/Ana Quispe.*retirado.*no se inscribió/s)
    )
  })

  /** Un retiro de otra gestión se deshace al inscribirlo: hay que decirlo, no callarlo. */
  it("says the student was reinstated from an earlier gestión", async () => {
    enrollSingle.mockResolvedValueOnce(
      result({ reinstated: [{ studentId: "s-1", fullName: "Ana Quispe" }] })
    )

    await run()

    expect(toast.warning).not.toHaveBeenCalled()
    expect(toast.success).toHaveBeenCalledWith(
      expect.stringMatching(/Ana Quispe.*reincorpor.*gestión anterior/s)
    )
  })
})
