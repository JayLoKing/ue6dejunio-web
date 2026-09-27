import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { SetHomeroomDialog } from "./SetHomeroomDialog"
import type { Course } from "../types/course"

const baseCourse: Course = {
  id: "course-1",
  gradeId: 1,
  gradeName: "Primero",
  parallelId: 1,
  parallelName: "A",
  academicYearId: 1,
  year: 2026,
  homeroomTeacherId: "t-1",
  homeroomTeacherName: "Nora Arnez",
  active: true,
  homeroomTeacherActive: true,
}

const mutateAsync = vi.fn()

// El hook queda fuera de la prueba: lo que se verifica es cómo el diálogo reacciona a
// homeroomTeacherActive, no el comportamiento de react-query.
vi.mock("../hooks/useCourses", () => ({
  useSetHomeroom: () => ({ mutateAsync, isPending: false }),
}))

vi.mock("@/features/catalog/hooks/useCatalog", () => ({
  useTeachers: () => ({
    data: [
      { id: "t-1", fullName: "Nora Arnez" },
      { id: "t-2", fullName: "Ana Perez" },
    ],
    isLoading: false,
  }),
}))

describe("SetHomeroomDialog", () => {
  it("advierte y deshabilita cuando el docente de aula actual sigue activo", () => {
    render(<SetHomeroomDialog course={baseCourse} onClose={vi.fn()} />)

    const warning = screen.getByText((_, element) =>
      Boolean(
        element?.tagName === "P" &&
        /sigue activo/i.test(element.textContent ?? "")
      )
    )
    expect(warning).toHaveTextContent("Nora Arnez")
    expect(screen.getByRole("combobox")).toBeDisabled()
    expect(screen.getByRole("button", { name: /Asignar/i })).toBeDisabled()
  })

  it("no advierte y queda usable cuando el docente de aula ya está inactivo", () => {
    const course: Course = { ...baseCourse, homeroomTeacherActive: false }
    render(<SetHomeroomDialog course={course} onClose={vi.fn()} />)

    expect(screen.queryByText(/sigue activo/i)).not.toBeInTheDocument()
    expect(screen.getByRole("combobox")).not.toBeDisabled()
    expect(screen.getByRole("button", { name: /Asignar/i })).not.toBeDisabled()
  })

  it("no advierte cuando el curso no tiene docente de aula", () => {
    const course: Course = {
      ...baseCourse,
      homeroomTeacherId: null,
      homeroomTeacherName: null,
      homeroomTeacherActive: false,
    }
    render(<SetHomeroomDialog course={course} onClose={vi.fn()} />)

    expect(screen.queryByText(/sigue activo/i)).not.toBeInTheDocument()
    expect(screen.getByRole("combobox")).not.toBeDisabled()
  })
})
