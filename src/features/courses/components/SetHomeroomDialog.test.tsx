import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { useAuthStore } from "@/features/auth/store/authStore"

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

/** De la gestión siguiente: su docente de aula (t-3) no ocupa nada en la gestión de baseCourse. */
const nextYearCourse: Course = {
  ...otherCourse,
  id: "course-4",
  academicYearId: 2,
  year: 2027,
  homeroomTeacherId: "t-3",
  homeroomTeacherName: "Carla Rojas",
}

const yearsAsked: (number | null)[] = []
const mutateAsync = vi.fn()
const swapMutateAsync = vi.fn()
let coursesLoading = false

// El hook queda fuera de la prueba: lo que se verifica es cómo el diálogo reacciona a
// homeroomTeacherActive, no el comportamiento de react-query.
vi.mock("../hooks/useCourses", () => ({
  useSetHomeroom: () => ({ mutateAsync, isPending: false }),
  useSwapHomeroom: () => ({ mutateAsync: swapMutateAsync, isPending: false }),
  // Como la API: sólo los cursos de la gestión pedida.
  useCoursesOfYear: (academicYearId: number | null) => {
    yearsAsked.push(academicYearId)
    return {
      data: coursesLoading
        ? undefined
        : {
            content: [baseCourse, otherCourse, nextYearCourse].filter(
              (c) => c.academicYearId === academicYearId
            ),
          },
      isLoading: coursesLoading,
    }
  },
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
    useAuthStore.setState({ role: "DIRECTOR" })
    coursesLoading = false
    yearsAsked.length = 0
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

/**
 * Un curso sin encargado y un candidato que sí tiene otro curso: no hay intercambio posible,
 * porque no hay a quién darle el curso que deja. El API lo rechaza; el diálogo tiene que decirlo
 * antes, y no dejar que el Director lo descubra apretando.
 */
describe("SetHomeroomDialog, curso sin docente de aula", () => {
  beforeEach(() => useAuthStore.setState({ role: "DIRECTOR" }))

  const orphanCourse: Course = {
    ...baseCourse,
    id: "course-3",
    homeroomTeacherId: null,
    homeroomTeacherName: null,
    homeroomTeacherActive: false,
  }

  it("avisa y no deja asignar a un docente que ya tiene otro curso", async () => {
    render(<SetHomeroomDialog course={orphanCourse} onClose={vi.fn()} />)

    await userEvent.click(screen.getByRole("combobox"))
    await userEvent.click(screen.getByRole("option", { name: "Ana Perez" }))

    expect(screen.getByText(/Segundo B/)).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /asignar/i })).toBeDisabled()
    expect(mutateAsync).not.toHaveBeenCalled()
  })

  it("busca el otro curso del docente sólo en la gestión del curso", () => {
    render(<SetHomeroomDialog course={orphanCourse} onClose={vi.fn()} />)

    expect(yearsAsked.at(-1)).toBe(orphanCourse.academicYearId)
  })

  it("no cuenta como ocupado al docente de aula de otra gestión", async () => {
    render(<SetHomeroomDialog course={orphanCourse} onClose={vi.fn()} />)

    // Carla Rojas es de aula de un curso de 2027; en la gestión de este curso no tiene ninguno.
    await userEvent.click(screen.getByRole("combobox"))
    await userEvent.click(screen.getByRole("option", { name: "Carla Rojas" }))

    expect(screen.queryByText(/ya es docente de aula/i)).not.toBeInTheDocument()
    expect(screen.getByRole("button", { name: /asignar/i })).toBeEnabled()
  })

  it("deja asignar a un docente libre", async () => {
    render(<SetHomeroomDialog course={orphanCourse} onClose={vi.fn()} />)

    await userEvent.click(screen.getByRole("combobox"))
    await userEvent.click(screen.getByRole("option", { name: "Carla Rojas" }))

    expect(screen.getByRole("button", { name: /asignar/i })).toBeEnabled()
  })
})

/**
 * El intercambio de docentes de aula es de Dirección: la API le responde 403 a la secretaría. La
 * reasignación llana de un curso sí es suya, y el diálogo no debe ofrecerle el camino que cierra.
 */
describe("SetHomeroomDialog, secretaría", () => {
  beforeEach(() => {
    coursesLoading = false
    vi.clearAllMocks()
    useAuthStore.setState({ role: "SECRETARY" })
  })

  it("no ofrece el intercambio: explica que es de Dirección y bloquea el botón", async () => {
    render(<SetHomeroomDialog course={baseCourse} onClose={vi.fn()} />)

    await userEvent.click(screen.getByRole("combobox"))
    await userEvent.click(screen.getByRole("option", { name: "Ana Perez" }))

    expect(
      screen.queryByRole("button", { name: /Intercambiar/i })
    ).not.toBeInTheDocument()
    expect(screen.getByText(/lo hace Dirección/i)).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /Asignar/i })).toBeDisabled()
    expect(swapMutateAsync).not.toHaveBeenCalled()
  })

  it("deja reasignar a un docente de aula sin curso cuando el actual ya está de baja", async () => {
    const course: Course = { ...baseCourse, homeroomTeacherActive: false }
    const onClose = vi.fn()
    render(<SetHomeroomDialog course={course} onClose={onClose} />)

    await userEvent.click(screen.getByRole("combobox"))
    await userEvent.click(screen.getByRole("option", { name: "Carla Rojas" }))
    await userEvent.click(screen.getByRole("button", { name: /Asignar/i }))

    expect(mutateAsync).toHaveBeenCalledWith({
      id: "course-1",
      teacherId: "t-3",
    })
  })
})
