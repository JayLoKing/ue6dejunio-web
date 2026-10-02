import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { CourseInfoModal } from "./CourseInfoModal"
import type { ClassGroupItem, Course, CourseOverview } from "../types/course"

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
  homeroomTeacherActive: true,
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

const reassign = vi.fn()
let role = "DIRECTOR"
let years = [{ id: 1, year: 2026, active: true, closed: false }]

// Los hooks quedan fuera de la prueba: lo que se verifica es cómo el diálogo lee el overview y
// qué ofrece, no el comportamiento de react-query.
vi.mock("../hooks/useCourses", () => ({
  useCourseOverview: () => overviewResult,
  useReassignSubjectTeacher: () => ({
    mutate: reassign,
    isPending: false,
    variables: undefined,
  }),
}))

vi.mock("@/features/auth/store/authStore", () => ({
  useAuthStore: (select: (s: { role: string }) => unknown) => select({ role }),
}))

vi.mock("@/features/catalog/hooks/useCatalog", () => ({
  useAcademicYears: () => ({ data: years }),
  // true = técnicos, false = de aula, como el catálogo real.
  useTeachers: (technical?: boolean) => ({
    data: technical
      ? [{ id: "tec-1", fullName: "Luis Mamani" }]
      : [
          { id: "t-1", fullName: "Prof. Lopez" },
          { id: "t-2", fullName: "Ana Perez" },
        ],
  }),
}))

beforeEach(() => {
  reassign.mockClear()
  role = "DIRECTOR"
  years = [{ id: 1, year: 2026, active: true, closed: false }]
})

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

const classGroup = (over: Partial<ClassGroupItem>): ClassGroupItem => ({
  id: "cg-1",
  courseId: "course-1",
  gradeName: "Primero",
  parallelName: "A",
  subjectId: "s-1",
  subjectName: "Matemática",
  teacherId: null,
  teacherName: "",
  active: true,
  ...over,
})

const withGroups = (classGroups: ClassGroupItem[], homeroom = course) => {
  overviewResult = {
    data: overview({ classGroups, course: homeroom }),
    isLoading: false,
    isError: false,
  }
}

const optionNames = () =>
  screen.getAllByRole("option").map((o) => o.textContent)

describe("CourseInfoModal, docente por materia", () => {
  it("offers only the non-technical teachers for an ordinary subject", async () => {
    withGroups([classGroup({})])
    render(<CourseInfoModal course={course} onClose={vi.fn()} />)

    await userEvent.click(screen.getByRole("combobox"))

    expect(optionNames()).toEqual(["Prof. Lopez", "Ana Perez"])
  })

  it("offers the technical teachers and the homeroom teacher for a technical subject", async () => {
    withGroups([classGroup({ id: "cg-2", subjectName: "Música" })])
    render(<CourseInfoModal course={course} onClose={vi.fn()} />)

    await userEvent.click(screen.getByRole("combobox"))

    expect(optionNames()).toEqual(["Luis Mamani", "Prof. Lopez"])
  })

  it("says the homeroom teacher has to come first when a technical subject has no one to fall back on", () => {
    withGroups([classGroup({ id: "cg-2", subjectName: "Religión" })], {
      ...course,
      homeroomTeacherId: null,
      homeroomTeacherName: null,
    })
    render(<CourseInfoModal course={course} onClose={vi.fn()} />)

    expect(
      screen.getByText(/asigna primero el docente de aula/i)
    ).toBeInTheDocument()
  })

  it("keeps showing the current teacher even when the rules no longer list them", () => {
    withGroups([classGroup({ teacherId: "gone-1", teacherName: "Rosa Gone" })])
    render(<CourseInfoModal course={course} onClose={vi.fn()} />)

    expect(screen.getByRole("combobox")).toHaveTextContent("Rosa Gone")
  })

  it("saves the picked teacher against that course and class group", async () => {
    withGroups([classGroup({ id: "cg-7" })])
    render(<CourseInfoModal course={course} onClose={vi.fn()} />)

    await userEvent.click(screen.getByRole("combobox"))
    await userEvent.click(screen.getByRole("option", { name: "Ana Perez" }))

    expect(reassign).toHaveBeenCalledWith({
      courseId: "course-1",
      classGroupId: "cg-7",
      teacherId: "t-2",
    })
  })

  it("is read-only when the course's year is closed", () => {
    years = [{ id: 1, year: 2026, active: false, closed: true }]
    withGroups([classGroup({ teacherId: "t-1", teacherName: "Prof. Lopez" })])
    render(<CourseInfoModal course={course} onClose={vi.fn()} />)

    expect(screen.queryByRole("combobox")).not.toBeInTheDocument()
    expect(
      within(screen.getByRole("listitem")).getByText("Prof. Lopez")
    ).toBeInTheDocument()
    expect(screen.getByText(/gestión está cerrada/i)).toBeInTheDocument()
  })

  it("does not offer the picker to anyone but the Director", () => {
    role = "TEACHER"
    withGroups([classGroup({})])
    render(<CourseInfoModal course={course} onClose={vi.fn()} />)

    expect(screen.queryByRole("combobox")).not.toBeInTheDocument()
    expect(screen.getByText("Sin docente")).toBeInTheDocument()
  })
})
