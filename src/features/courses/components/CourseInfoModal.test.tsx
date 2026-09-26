import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { CourseInfoModal } from "./CourseInfoModal"
import type { Course, CourseOverview } from "../types/course"

const course: Course = {
  id: "course-1",
  gradeId: 1,
  gradeName: "Primero",
  parallelId: 1,
  parallelName: "A",
  academicYearId: 1,
  year: 2026,
  homeroomTeacherId: "t-1",
  homeroomTeacherName: "Prof. Lopez",
  active: true,
}

const overview = (over: Partial<CourseOverview> = {}): CourseOverview => ({
  course,
  classGroups: [],
  students: { content: [], page: 1, size: 30, total: 0, totalPages: 0 },
  males: 0,
  females: 0,
  activeStudents: 0,
  ...over,
})

let overviewResult: {
  data: CourseOverview | undefined
  isLoading: boolean
  isError: boolean
} = { data: overview(), isLoading: false, isError: false }

// El hook queda fuera de la prueba: lo que se verifica es cómo el diálogo lee males/females,
// no el comportamiento de react-query.
vi.mock("../hooks/useCourses", () => ({
  useCourseOverview: () => overviewResult,
}))

describe("CourseInfoModal", () => {
  /** Los dos conteos vienen del backend; ya no hay placeholder "pendiente backend". */
  it("muestra los conteos de varones y mujeres que trae el overview", () => {
    overviewResult = {
      data: overview({ males: 3, females: 2 }),
      isLoading: false,
      isError: false,
    }

    render(<CourseInfoModal course={course} onClose={vi.fn()} />)

    expect(screen.getByText("Varones")).toBeInTheDocument()
    expect(screen.getByText("3")).toBeInTheDocument()
    expect(screen.getByText("Mujeres")).toBeInTheDocument()
    expect(screen.getByText("2")).toBeInTheDocument()
    expect(screen.queryByText("pendiente backend")).not.toBeInTheDocument()
  })

  /** Un curso solo de varones informa 0 mujeres, no un guion ni un vacío. */
  it("informa 0 y no un guion cuando un género no tiene estudiantes", () => {
    overviewResult = {
      data: overview({ males: 5, females: 0 }),
      isLoading: false,
      isError: false,
    }

    render(<CourseInfoModal course={course} onClose={vi.fn()} />)

    expect(screen.getByText("Mujeres").nextSibling).toHaveTextContent("0")
  })

  /**
   * Los tres números cuentan a la misma gente.
   *
   * `students.total` es el registro académico y conserva al estudiante retirado, porque las notas
   * que sacó antes de irse siguen siendo del año. Puesto arriba de varones y mujeres daba 3 sobre
   * 1 + 1, una resta que el Director no tenía cómo explicarse.
   */
  it("muestra la matrícula activa y no el registro con retirados", () => {
    overviewResult = {
      data: overview({
        males: 1,
        females: 1,
        activeStudents: 2,
        students: { content: [], page: 1, size: 30, total: 3, totalPages: 1 },
      }),
      isLoading: false,
      isError: false,
    }

    render(<CourseInfoModal course={course} onClose={vi.fn()} />)

    expect(screen.getByText("Total estudiantes").nextSibling).toHaveTextContent(
      "2"
    )
  })
})
