import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { AssignCourseSubjectsForm } from "./AssignCourseSubjectsForm"
import type { Course } from "../types/course"

const course = (over: Partial<Course>): Course => ({
  id: "c-1",
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

/** Primero A ya existe y su encargada es Nora Arnez: ese paralelo y esa docente están ocupados. */
const primeroA = course({ id: "c-1", homeroomTeacherId: "t-1" })

/** De la gestión anterior: ni su paralelo ni su docente ocupan nada en la que se está armando. */
const primeroBDe2025 = course({
  id: "c-old",
  parallelId: 2,
  parallelName: "B",
  academicYearId: 1,
  year: 2025,
  homeroomTeacherId: "t-2",
})

let coursesLoading = false
let yearsLoading = false

vi.mock("../hooks/useCourses", () => ({
  useCreateCourse: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useAllCourses: () => ({
    data: coursesLoading ? undefined : { content: [primeroA, primeroBDe2025] },
    isLoading: coursesLoading,
  }),
}))

vi.mock("@/features/catalog/hooks/useCatalog", () => ({
  useGrades: () => ({
    data: [
      { id: 1, name: "Primero", level: "Primaria" },
      { id: 2, name: "Segundo", level: "Primaria" },
    ],
    isLoading: false,
  }),
  useParallels: () => ({
    data: [
      { id: 1, name: "A" },
      { id: 2, name: "B" },
    ],
    isLoading: false,
  }),
  useSubjects: () => ({ data: [], isLoading: false }),
  useTeachers: () => ({
    data: [
      { id: "t-1", fullName: "Nora Arnez" },
      { id: "t-2", fullName: "Ana Perez" },
      { id: "t-3", fullName: "Carla Rojas" },
    ],
    isLoading: false,
  }),
  // La primera es la actual: así las ordena el backend, y es de la que hablan las dos reglas.
  useAcademicYears: () => ({
    data: yearsLoading
      ? undefined
      : [
          { id: 2, year: 2026 },
          { id: 1, year: 2025 },
        ],
    isLoading: yearsLoading,
  }),
}))

const openSelect = async (label: RegExp) => {
  await userEvent.click(screen.getByRole("combobox", { name: label }))
}

describe("AssignCourseSubjectsForm, paralelos ya usados por el grado", () => {
  beforeEach(() => {
    coursesLoading = false
    yearsLoading = false
  })

  it("deshabilita el paralelo que el grado ya tiene y dice cuál curso lo ocupa", async () => {
    render(<AssignCourseSubjectsForm />)

    await openSelect(/grado/i)
    await userEvent.click(screen.getByRole("option", { name: /Primero/ }))
    await openSelect(/paralelo/i)

    const ocupado = screen.getByRole("option", { name: /Primero A/ })
    expect(ocupado).toHaveAttribute("aria-disabled", "true")
    expect(ocupado).toHaveTextContent(/ya existe Primero A/i)
  })

  it("deja libre el paralelo que el grado no usa en esta gestión", async () => {
    render(<AssignCourseSubjectsForm />)

    await openSelect(/grado/i)
    await userEvent.click(screen.getByRole("option", { name: /Primero/ }))
    await openSelect(/paralelo/i)

    // B existe, pero en 2025: la gestión que se está armando lo tiene libre.
    expect(screen.getByRole("option", { name: "B" })).not.toHaveAttribute(
      "aria-disabled",
      "true"
    )
  })

  /**
   * El orden importa: se puede elegir el paralelo antes del grado. Si el grado que se elige después
   * ya tiene ese paralelo, la elección quedó imposible, y dejarla puesta mandaría a guardar
   * justamente la combinación que la pantalla dibuja deshabilitada.
   */
  it("suelta el paralelo elegido cuando el grado nuevo ya lo tiene", async () => {
    render(<AssignCourseSubjectsForm />)

    await openSelect(/paralelo/i)
    await userEvent.click(screen.getByRole("option", { name: "A" }))
    expect(
      screen.getByRole("combobox", { name: /paralelo/i })
    ).toHaveTextContent("A")

    await openSelect(/grado/i)
    await userEvent.click(screen.getByRole("option", { name: /Primero/ }))

    expect(
      screen.getByRole("combobox", { name: /paralelo/i })
    ).toHaveTextContent(/Selecciona paralelo/i)
  })

  it("no reclama ningún paralelo antes de elegir el grado", async () => {
    render(<AssignCourseSubjectsForm />)

    await openSelect(/paralelo/i)

    expect(screen.getByRole("option", { name: "A" })).not.toHaveAttribute(
      "aria-disabled",
      "true"
    )
  })
})

describe("AssignCourseSubjectsForm, docentes ya encargados", () => {
  beforeEach(() => {
    coursesLoading = false
    yearsLoading = false
  })

  it("deshabilita al docente que ya es de aula y dice de qué curso", async () => {
    render(<AssignCourseSubjectsForm />)

    await openSelect(/docente de aula/i)

    const ocupada = screen.getByRole("option", { name: /Nora Arnez/ })
    expect(ocupada).toHaveAttribute("aria-disabled", "true")
    expect(ocupada).toHaveTextContent(/docente de aula de Primero A/i)
  })

  it("deja libre al docente que no es de aula de ningún curso de esta gestión", async () => {
    render(<AssignCourseSubjectsForm />)

    await openSelect(/docente de aula/i)

    // Ana Perez fue encargada en 2025; Carla Rojas nunca lo fue. Las dos están libres hoy.
    expect(
      screen.getByRole("option", { name: "Ana Perez" })
    ).not.toHaveAttribute("aria-disabled", "true")
    expect(
      screen.getByRole("option", { name: "Carla Rojas" })
    ).not.toHaveAttribute("aria-disabled", "true")
  })
})

/**
 * Sin los cursos o sin saber cuál es la gestión, las dos reglas no pueden decir nada. Dejar elegir
 * mientras tanto ofrece opciones que un instante después se deshabilitan solas — la misma razón por
 * la que SetHomeroomDialog espera a los cursos antes de habilitar su selector.
 */
describe("AssignCourseSubjectsForm, mientras no sabe qué está ocupado", () => {
  beforeEach(() => {
    coursesLoading = false
    yearsLoading = false
  })

  it("no deja elegir paralelo ni docente mientras cargan los cursos", () => {
    coursesLoading = true

    render(<AssignCourseSubjectsForm />)

    expect(screen.getByRole("combobox", { name: /paralelo/i })).toBeDisabled()
    expect(
      screen.getByRole("combobox", { name: /docente de aula/i })
    ).toBeDisabled()
  })

  it("no deja elegir paralelo ni docente mientras carga la gestión", () => {
    yearsLoading = true

    render(<AssignCourseSubjectsForm />)

    expect(screen.getByRole("combobox", { name: /paralelo/i })).toBeDisabled()
    expect(
      screen.getByRole("combobox", { name: /docente de aula/i })
    ).toBeDisabled()
  })
})
