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
vi.mock("./EditStudentDialog", () => ({
  EditStudentDialog: () => null,
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
  incomplete: false,
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

  it("offers the Director the edit on every row", () => {
    useAuthStore.setState({ role: "DIRECTOR" })

    render(<CourseStudentsPanel courseId="c-1" />)

    expect(
      screen.getByRole("button", { name: "Editar datos de Ana Quispe" })
    ).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: "Editar datos de Luis Mamani" })
    ).toBeInTheDocument()
  })

  it("offers the Secretary no edit", () => {
    useAuthStore.setState({ role: "SECRETARY" })

    render(<CourseStudentsPanel courseId="c-1" />)

    expect(
      screen.queryByRole("button", { name: /Editar datos de/ })
    ).not.toBeInTheDocument()
  })

  // The homeroom teacher of this course: only the students still in it.
  it("offers the homeroom teacher the edit on effective rows only", () => {
    useAuthStore.setState({
      role: "TEACHER",
      courseId: "c-1",
      isTechnical: false,
    })

    render(<CourseStudentsPanel courseId="c-1" />)

    expect(
      screen.getByRole("button", { name: "Editar datos de Ana Quispe" })
    ).toBeInTheDocument()
    expect(
      screen.queryByRole("button", { name: "Editar datos de Luis Mamani" })
    ).not.toBeInTheDocument()
  })
})
