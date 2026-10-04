import { render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { useAuthStore } from "@/features/auth/store/authStore"

import { CourseStudentsPanel } from "./CourseStudentsPanel"

const useStudentDirectory = vi.hoisted(() => vi.fn())

vi.mock("../hooks/useStudentDirectory", () => ({ useStudentDirectory }))
vi.mock("./WithdrawStudentDialog", () => ({
  WithdrawStudentDialog: () => null,
}))
vi.mock("./StudentWithdrawalDialog", () => ({
  StudentWithdrawalDialog: () => null,
}))

const student = (over: Record<string, unknown>) => ({
  id: "st-1",
  rudeCode: "1",
  identityCard: "2",
  fullName: "Ana Quispe",
  grade: "Primero",
  parallel: "A",
  level: null,
  status: "Effective",
  academicYear: 2026,
  courseId: "c-1",
  parallelId: 3,
  ...over,
})

describe("CourseStudentsPanel", () => {
  beforeEach(() => {
    useStudentDirectory.mockReturnValue({
      isLoading: false,
      isFetching: false,
      refetch: vi.fn(),
      data: {
        content: [
          student({}),
          student({ id: "st-2", fullName: "Luis Mamani", status: "Withdrawn" }),
        ],
        total: 2,
        totalPages: 1,
      },
    })
  })

  // The Secretary reads the notebook; taking someone off the roll stays the Director's.
  it("offers the Secretary neither withdrawal nor reinstatement", () => {
    useAuthStore.setState({ role: "SECRETARY" })

    render(<CourseStudentsPanel courseId="c-1" />)

    expect(screen.getByText("Ana Quispe")).toBeInTheDocument()
    expect(
      screen.queryByRole("button", { name: /Dar de baja a/ })
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole("button", { name: /Reincorporar a/ })
    ).not.toBeInTheDocument()
  })

  it("offers the Director the withdrawal", () => {
    useAuthStore.setState({ role: "DIRECTOR" })

    render(<CourseStudentsPanel courseId="c-1" />)

    expect(
      screen.getByRole("button", { name: /Dar de baja a Ana Quispe/ })
    ).toBeInTheDocument()
  })
})
