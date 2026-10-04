import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { useAuthStore } from "@/features/auth/store/authStore"

import { ParallelCoursesPage } from "./ParallelCoursesPage"
import type { Course } from "../types/course"

const course = (over: Partial<Course>): Course => ({
  id: "c",
  gradeId: 1,
  gradeName: "Primero",
  parallelId: 1,
  parallelName: "A",
  academicYearId: 2,
  year: 2026,
  homeroomTeacherId: null,
  homeroomTeacherName: null,
  active: true,
  homeroomTeacherActive: false,
  ...over,
})

const c2026 = course({ id: "c-2026", gradeName: "Primero 2026-row" })
const c2027 = course({
  id: "c-2027",
  gradeName: "Primero 2027-row",
  academicYearId: 3,
  year: 2027,
})
const otherParallel = course({
  id: "c-b",
  gradeName: "Segundo B-row",
  parallelId: 2,
  parallelName: "B",
})

interface QueryState {
  data?: { content: Course[] }
  isLoading: boolean
  isError: boolean
}

let years: {
  data:
    | { id: number; year: number; active: boolean; closed: boolean }[]
    | undefined
  isLoading: boolean
  isError: boolean
}
let coursesState: (yearId: number | null) => QueryState
const yearCalls: (number | null)[] = []

vi.mock("@tanstack/react-router", () => ({
  Link: ({ children }: { children: React.ReactNode }) => <a>{children}</a>,
}))

vi.mock("@/features/catalog/hooks/useCatalog", () => ({
  useAcademicYears: () => years,
  useParallels: () => ({ data: [{ id: 1, name: "A" }] }),
}))

const reactivate = vi.fn()

vi.mock("../hooks/useCourses", () => ({
  useCoursesOfYear: (id: number | null) => {
    yearCalls.push(id)
    return coursesState(id)
  },
  useReactivateCourse: () => ({ mutate: reactivate, isPending: false }),
}))

vi.mock("./CourseInfoModal", () => ({ CourseInfoModal: () => null }))
vi.mock("./SetHomeroomDialog", () => ({ SetHomeroomDialog: () => null }))
vi.mock("./DeactivateCourseDialog", () => ({
  DeactivateCourseDialog: ({ course }: { course: Course | null }) =>
    course ? <div role="alertdialog">Baja de {course.id}</div> : null,
}))

beforeEach(() => {
  reactivate.mockReset()
  useAuthStore.setState({ role: "DIRECTOR" })
  yearCalls.length = 0
  years = {
    data: [
      { id: 1, year: 2025, active: false, closed: true },
      { id: 2, year: 2026, active: true, closed: false },
      { id: 3, year: 2027, active: false, closed: false },
    ],
    isLoading: false,
    isError: false,
  }
  coursesState = (yearId) => ({
    data: {
      content:
        yearId === 2 ? [c2026, otherParallel] : yearId === 3 ? [c2027] : [],
    },
    isLoading: false,
    isError: false,
  })
})

describe("ParallelCoursesPage", () => {
  it("defaults to the active year and lists only the courses of this parallel", () => {
    render(<ParallelCoursesPage parallelId="1" />)
    expect(yearCalls.at(-1)).toBe(2)
    expect(screen.getByRole("combobox")).toHaveTextContent("Gestión 2026")
    expect(screen.getByText("Primero 2026-row")).toBeInTheDocument()
    expect(screen.queryByText("Segundo B-row")).not.toBeInTheDocument()
    expect(screen.queryByText("Primero 2027-row")).not.toBeInTheDocument()
  })

  it("refetches the courses of the year the Director switches to", async () => {
    render(<ParallelCoursesPage parallelId="1" />)
    await userEvent.click(screen.getByRole("combobox"))
    await userEvent.click(
      await screen.findByRole("option", { name: "Gestión 2027" })
    )
    expect(yearCalls.at(-1)).toBe(3)
    expect(screen.getByText("Primero 2027-row")).toBeInTheDocument()
    expect(screen.queryByText("Primero 2026-row")).not.toBeInTheDocument()
  })

  it("says the year has no courses when the fetch succeeded empty", async () => {
    render(<ParallelCoursesPage parallelId="1" />)
    await userEvent.click(screen.getByRole("combobox"))
    await userEvent.click(
      await screen.findByRole("option", { name: "Gestión 2025 (cerrada)" })
    )
    expect(screen.getByText("Sin cursos en este paralelo.")).toBeInTheDocument()
  })

  it("shows an error, not the empty state, when the courses fetch fails", () => {
    coursesState = () => ({ data: undefined, isLoading: false, isError: true })
    render(<ParallelCoursesPage parallelId="1" />)
    expect(screen.getByRole("alert")).toHaveTextContent(
      "No se pudieron cargar los cursos"
    )
    expect(
      screen.queryByText("Sin cursos en este paralelo.")
    ).not.toBeInTheDocument()
  })

  it("shows an error when the years fetch fails", () => {
    years = { data: undefined, isLoading: false, isError: true }
    render(<ParallelCoursesPage parallelId="1" />)
    expect(screen.getByRole("alert")).toHaveTextContent(
      "No se pudieron cargar las gestiones"
    )
  })

  it("asks for a year when none is active", () => {
    years = {
      data: [{ id: 1, year: 2025, active: false, closed: true }],
      isLoading: false,
      isError: false,
    }
    render(<ParallelCoursesPage parallelId="1" />)
    expect(yearCalls.at(-1)).toBeNull()
    expect(screen.getByText(/No hay una gestión activa/)).toBeInTheDocument()
  })
})

describe("ParallelCoursesPage, actions by role", () => {
  it("gives the Director the notebook, the info and the homeroom teacher", () => {
    render(<ParallelCoursesPage parallelId="1" />)
    expect(screen.getByText("Cuaderno")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /Info/ })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /Docente/ })).toBeInTheDocument()
  })

  // The API answers 200 to the Secretary on every notebook read; the writes stay closed in the panels.
  it("gives the Secretary the homeroom teacher, the info and the notebook", () => {
    useAuthStore.setState({ role: "SECRETARY" })
    render(<ParallelCoursesPage parallelId="1" />)
    expect(screen.getByText("Cuaderno")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /Info/ })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /Docente/ })).toBeInTheDocument()
  })

  it("gives the Director and the Secretary the deactivation, behind a confirmation", async () => {
    for (const role of ["DIRECTOR", "SECRETARY"]) {
      useAuthStore.setState({ role })
      const { unmount } = render(<ParallelCoursesPage parallelId="1" />)
      await userEvent.click(screen.getByRole("button", { name: /Dar de baja/ }))
      expect(screen.getByRole("alertdialog")).toHaveTextContent("c-2026")
      unmount()
    }
  })

  it("offers a Teacher no way to deactivate or reactivate", () => {
    useAuthStore.setState({ role: "TEACHER" })
    coursesState = () => ({
      data: { content: [c2026, course({ id: "c-off", active: false })] },
      isLoading: false,
      isError: false,
    })
    render(<ParallelCoursesPage parallelId="1" />)
    expect(
      screen.queryByRole("button", { name: /Dar de baja/ })
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole("button", { name: /Reactivar/ })
    ).not.toBeInTheDocument()
  })

  it("shows a deactivated course as such and lets it be reactivated", async () => {
    coursesState = () => ({
      data: { content: [course({ id: "c-off", active: false })] },
      isLoading: false,
      isError: false,
    })
    render(<ParallelCoursesPage parallelId="1" />)
    expect(screen.getByText("De baja")).toBeInTheDocument()
    expect(
      screen.queryByRole("button", { name: /Dar de baja/ })
    ).not.toBeInTheDocument()
    await userEvent.click(screen.getByRole("button", { name: /Reactivar/ }))
    expect(reactivate).toHaveBeenCalledWith("c-off")
  })
})
