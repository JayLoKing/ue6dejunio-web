import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { AxiosError, type AxiosResponse } from "axios"
import { beforeEach, describe, expect, it, vi } from "vitest"

const mutateAsync = vi.hoisted(() => vi.fn())
const useActiveYearCourses = vi.hoisted(() => vi.fn())

// The mutation is stubbed so these tests are about the flow the dialog drives, not react-query:
// what reaches the API is asserted through the variables it was handed.
vi.mock("../hooks/useStudentDirectory", () => ({
  useReinstateStudent: () => ({ mutateAsync, isPending: false }),
}))
vi.mock("@/features/courses/hooks/useActiveYearCourses", () => ({
  useActiveYearCourses,
}))

import { ReinstateStudentDialog } from "./ReinstateStudentDialog"

const student = { id: "st-1", fullName: "Ana Quispe" }

/** What axios rejects with: the interceptor re-rejects, so the status is on `response`. */
const httpError = (status: number) =>
  new AxiosError("fail", "ERR_BAD_REQUEST", undefined, undefined, {
    status,
  } as AxiosResponse)

const open = (onClose = vi.fn()) => {
  render(<ReinstateStudentDialog student={student} onClose={onClose} />)
  return onClose
}

beforeEach(() => {
  vi.clearAllMocks()
  useActiveYearCourses.mockReturnValue({
    data: {
      content: [
        { id: "c-1", gradeName: "Primero", parallelName: "A" },
        { id: "c-2", gradeName: "Segundo", parallelName: "B" },
      ],
    },
    academicYearId: 7,
    isLoading: false,
    isError: false,
  })
})

describe("ReinstateStudentDialog", () => {
  it("names who is coming back", () => {
    open()

    expect(screen.getByText(/Ana Quispe/)).toBeInTheDocument()
  })

  /** A withdrawn seat in the active year is reopened by the API, so no course is asked for. */
  it("confirms with an empty body and closes on success", async () => {
    mutateAsync.mockResolvedValueOnce({})
    const onClose = open()

    await userEvent.click(screen.getByRole("button", { name: "Reincorporar" }))

    expect(mutateAsync).toHaveBeenCalledWith({ id: "st-1" })
    expect(onClose).toHaveBeenCalled()
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument()
  })

  /** No seat to reopen: the API answers 400 asking for a course of the active year. */
  it("asks for a course after the 400 and resends with it", async () => {
    mutateAsync.mockRejectedValueOnce(httpError(400))
    mutateAsync.mockResolvedValueOnce({})
    const onClose = open()

    await userEvent.click(screen.getByRole("button", { name: "Reincorporar" }))

    expect(await screen.findByRole("combobox")).toBeInTheDocument()
    expect(onClose).not.toHaveBeenCalled()
    expect(screen.getByRole("button", { name: "Reincorporar" })).toBeDisabled()

    await userEvent.click(screen.getByRole("combobox"))
    await userEvent.click(screen.getByRole("option", { name: "Segundo B" }))
    await userEvent.click(screen.getByRole("button", { name: "Reincorporar" }))

    expect(mutateAsync).toHaveBeenLastCalledWith({
      id: "st-1",
      courseId: "c-2",
    })
    expect(onClose).toHaveBeenCalled()
  })

  /** Only the 400 means "pick a course"; a 409 (not withdrawn, closed year) is not fixable here. */
  it("does not ask for a course on any other failure", async () => {
    mutateAsync.mockRejectedValueOnce(httpError(409))
    const onClose = open()

    await userEvent.click(screen.getByRole("button", { name: "Reincorporar" }))

    expect(mutateAsync).toHaveBeenCalledTimes(1)
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument()
    expect(onClose).not.toHaveBeenCalled()
  })
})
