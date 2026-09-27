import { render, screen, within } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

/** El Link de TanStack necesita un router montado; acá sólo lleva a la grilla del criterio. */
vi.mock("@tanstack/react-router", () => ({
  Link: ({
    children,
    to: _to,
    params: _params,
    search: _search,
    ...rest
  }: {
    children: React.ReactNode
    to?: string
    params?: unknown
    search?: unknown
  }) => (
    <a href="#" {...rest}>
      {children}
    </a>
  ),
}))

import { SubjectScoreSheet } from "./SubjectScoreSheet"
import type { ClassGroupItem } from "@/features/courses/types/course"
import type { Criterion } from "@/features/assessment/types"

const classGroup: ClassGroupItem = {
  id: "cg-1",
  courseId: "c-1",
  gradeName: "Primero",
  parallelName: "A",
  subjectId: "s-1",
  subjectName: "Matematica",
  teacherId: "t-1",
  teacherName: "Nora Arnez",
  active: true,
}

/** Directo: la columna de este criterio es la casilla que el docente teclea en esta hoja. */
const criterion: Criterion = {
  id: "cr-1",
  classGroupId: "cg-1",
  trimester: 1,
  dimension: "Doing",
  name: "Participacion",
  activityName: null,
  curriculumPlanId: null,
}

const students = [
  {
    courseEnrollmentId: "ce-1",
    studentId: "st-1",
    rudeCode: "1",
    identityCard: "1",
    fullName: "Ana Quispe",
    status: "Effective",
  },
  {
    courseEnrollmentId: "ce-2",
    studentId: "st-2",
    rudeCode: "2",
    identityCard: "2",
    fullName: "Luis Mamani",
    status: "Withdrawn",
  },
]

vi.mock("@/features/courses/hooks/useCourses", () => ({
  useCourseStudents: () => ({ data: { content: students }, isLoading: false }),
}))

// TrimesterSelect los lee para nombrar cada trimestre con sus fechas.
vi.mock("@/features/catalog/hooks/useCatalog", () => ({
  useTrimesters: () => ({ data: [], isLoading: false }),
}))

vi.mock("@/features/risk/hooks/useRisk", () => ({
  useClassGroupRisk: () => ({ data: [], isLoading: false }),
  usePredictClassGroupRisk: () => ({ mutate: vi.fn(), isPending: false }),
}))

vi.mock("@/features/assessment/hooks/useAssessment", () => ({
  useCriteria: () => ({ data: [criterion], isLoading: false }),
  useCriteriaEvents: () => ({ byCriterion: {}, isLoading: false }),
  useCriteriaScores: () => ({ matrix: {}, isLoading: false }),
  useEventScores: () => ({ matrix: {}, isLoading: false }),
  useSetScore: () => ({ mutate: vi.fn(), isPending: false }),
  useDeleteScore: () => ({ mutate: vi.fn(), isPending: false }),
}))

vi.mock("@/features/assessment/components/CriteriaManager", () => ({
  CriteriaManager: () => null,
}))

const rowOf = (name: string) =>
  screen.getByText(name).closest("tr") as HTMLElement

/**
 * La misma regla que en la grilla de criterio, y por eso está acá también: son dos puertas a la
 * misma nota. Arreglar una sola deja la otra abierta.
 */
describe("SubjectScoreSheet, estudiante dado de baja", () => {
  it("no deja teclear la nota del retirado", () => {
    render(<SubjectScoreSheet classGroup={classGroup} />)

    const inputs = within(rowOf("Luis Mamani")).getAllByRole("spinbutton")
    expect(inputs).not.toHaveLength(0)
    for (const input of inputs) expect(input).toBeDisabled()
  })

  it("dice en la fila por qué está apagada", () => {
    render(<SubjectScoreSheet classGroup={classGroup} />)

    expect(rowOf("Luis Mamani")).toHaveTextContent(/dado de baja/i)
  })

  it("deja calificar al resto del curso", () => {
    render(<SubjectScoreSheet classGroup={classGroup} />)

    const inputs = within(rowOf("Ana Quispe")).getAllByRole("spinbutton")
    expect(inputs).not.toHaveLength(0)
    for (const input of inputs) expect(input).toBeEnabled()
    expect(rowOf("Ana Quispe")).not.toHaveTextContent(/dado de baja/i)
  })
})
