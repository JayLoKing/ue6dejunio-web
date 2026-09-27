import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

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

/** Segundo curso: su docente de aula (t-2) es el candidato que hace posible un intercambio. */
const otherCourse: Course = {
  id: "course-2",
  gradeId: 2,
  gradeName: "Segundo",
  parallelId: 2,
  parallelName: "B",
  academicYearId: 1,
  year: 2026,
  homeroomTeacherId: "t-2",
  homeroomTeacherName: "Ana Perez",
  active: true,
  homeroomTeacherActive: true,
}

const mutateAsync = vi.fn()
const swapMutateAsync = vi.fn()
let coursesLoading = false

// El hook queda fuera de la prueba: lo que se verifica es cómo el diálogo reacciona a
// homeroomTeacherActive, no el comportamiento de react-query.
vi.mock("../hooks/useCourses", () => ({
  useSetHomeroom: () => ({ mutateAsync, isPending: false }),
  useSwapHomeroom: () => ({ mutateAsync: swapMutateAsync, isPending: false }),
  useAllCourses: () => ({
    data: coursesLoading ? undefined : { content: [baseCourse, otherCourse] },
    isLoading: coursesLoading,
  }),
}))

vi.mock("@/features/catalog/hooks/useCatalog", () => ({
  useTeachers: () => ({
    data: [
      { id: "t-1", fullName: "Nora Arnez" },
      { id: "t-2", fullName: "Ana Perez" },
      { id: "t-3", fullName: "Carla Rojas" },
    ],
    isLoading: false,
  }),
}))

describe("SetHomeroomDialog", () => {
  beforeEach(() => {
    coursesLoading = false
    vi.clearAllMocks()
  })

  /**
   * Sin los cursos cargados no se sabe si el docente elegido es de aula de otro, y el diálogo
   * mostraría el bloqueo de reasignación para corregirse un instante después. Elegir con el cartel
   * equivocado delante es peor que esperar.
   */
  it("no deja elegir mientras no sabe si el candidato es un intercambio", () => {
    coursesLoading = true

    render(<SetHomeroomDialog course={baseCourse} onClose={vi.fn()} />)

    expect(screen.getByRole("combobox")).toBeDisabled()
  })

  it("advierte y deshabilita Asignar al elegir un tercero mientras el docente actual sigue activo", async () => {
    render(<SetHomeroomDialog course={baseCourse} onClose={vi.fn()} />)

    // Carla Rojas no es de aula de ningún curso: elegirla es una reasignación llana, no un
    // intercambio, así que la regla de baja previa sigue aplicando.
    await userEvent.click(screen.getByRole("combobox"))
    await userEvent.click(screen.getByRole("option", { name: "Carla Rojas" }))

    const warning = screen.getByText((_, element) =>
      Boolean(
        element?.tagName === "P" &&
        /sigue activo/i.test(element.textContent ?? "")
      )
    )
    expect(warning).toHaveTextContent("Nora Arnez")
    // El select se mantiene usable: así el Director puede seguir explorando otro candidato,
    // por ejemplo uno que sí habilite un intercambio.
    expect(screen.getByRole("combobox")).not.toBeDisabled()
    expect(screen.getByRole("button", { name: /Asignar/i })).toBeDisabled()
  })

  it("propone el intercambio al elegir un docente que ya es de aula de otro curso", async () => {
    render(<SetHomeroomDialog course={baseCourse} onClose={vi.fn()} />)

    await userEvent.click(screen.getByRole("combobox"))
    await userEvent.click(screen.getByRole("option", { name: "Ana Perez" }))

    expect(screen.queryByText(/sigue activo/i)).not.toBeInTheDocument()
    const swapExplanation = screen.getByText((_, element) =>
      Boolean(
        element?.tagName === "P" &&
        /intercambi/i.test(element.textContent ?? "")
      )
    )
    expect(swapExplanation).toHaveTextContent("Ana Perez")
    expect(swapExplanation).toHaveTextContent("Segundo B")
    expect(swapExplanation).toHaveTextContent("Nora Arnez")
    expect(swapExplanation).toHaveTextContent("Primero A")
    expect(screen.getByRole("combobox")).not.toBeDisabled()
    expect(
      screen.getByRole("button", { name: /Intercambiar/i })
    ).not.toBeDisabled()
  })

  it("al confirmar el intercambio llama al hook de swap con ambos cursos", async () => {
    const onClose = vi.fn()
    render(<SetHomeroomDialog course={baseCourse} onClose={onClose} />)

    await userEvent.click(screen.getByRole("combobox"))
    await userEvent.click(screen.getByRole("option", { name: "Ana Perez" }))
    await userEvent.click(screen.getByRole("button", { name: /Intercambiar/i }))

    expect(swapMutateAsync).toHaveBeenCalledWith({
      courseAId: "course-1",
      courseBId: "course-2",
    })
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
