import { fireEvent, render, screen, within } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

const toastWarning = vi.hoisted(() => vi.fn())
vi.mock("sonner", () => ({ toast: { warning: toastWarning } }))

/** El Link de TanStack necesita un router montado; acá sólo hace de "Volver". */
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

import { CriterionScoreSheet } from "./CriterionScoreSheet"
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

/** Criterio directo: su única casilla ES la nota, así que es la que se puede teclear. */
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

const setScoreMutate = vi.fn()

vi.mock("@/features/courses/hooks/useCourses", () => ({
  useCourseStudents: () => ({
    data: { content: students },
    isLoading: false,
  }),
}))

vi.mock("@/features/assessment/hooks/useAssessment", () => ({
  useCriteriaEvents: () => ({ byCriterion: {}, isLoading: false }),
  useEventScores: () => ({ matrix: {}, isLoading: false }),
  useCriterionScores: () => ({ byEnrollment: {}, isLoading: false }),
  useSetScore: () => ({ mutate: setScoreMutate, isPending: false }),
  useDeleteScore: () => ({ mutate: vi.fn(), isPending: false }),
}))

const rowOf = (name: string) =>
  screen.getByText(name).closest("tr") as HTMLElement

/**
 * El padrón académico conserva al retirado a propósito: las notas que sacó antes de irse siguen
 * siendo del año. Pero la escuela deja de calificarlo el día que se va, así que su fila se lee y no
 * se escribe. Y una fila apagada sin motivo se lee como un error del sistema.
 */
describe("CriterionScoreSheet, estudiante dado de baja", () => {
  it("no deja teclear la nota del retirado", () => {
    render(
      <CriterionScoreSheet classGroup={classGroup} criterion={criterion} />
    )

    const inputs = within(rowOf("Luis Mamani")).getAllByRole("spinbutton")
    expect(inputs).not.toHaveLength(0)
    for (const input of inputs) expect(input).toBeDisabled()
  })

  it("dice en la fila por qué está apagada", () => {
    render(
      <CriterionScoreSheet classGroup={classGroup} criterion={criterion} />
    )

    expect(rowOf("Luis Mamani")).toHaveTextContent(/dado de baja/i)
  })

  it("deja calificar al resto del curso", () => {
    render(
      <CriterionScoreSheet classGroup={classGroup} criterion={criterion} />
    )

    const inputs = within(rowOf("Ana Quispe")).getAllByRole("spinbutton")
    expect(inputs).not.toHaveLength(0)
    for (const input of inputs) expect(input).toBeEnabled()
    expect(rowOf("Ana Quispe")).not.toHaveTextContent(/dado de baja/i)
  })
})

/**
 * Es la otra puerta a la misma nota: el tope se aplica igual, y el aviso también.
 */
describe("CriterionScoreSheet, nota fuera del rango", () => {
  beforeEach(() => {
    toastWarning.mockClear()
    setScoreMutate.mockClear()
  })

  const typeAndLeave = (value: string) => {
    const [input] = within(rowOf("Ana Quispe")).getAllByRole("spinbutton")
    fireEvent.change(input, { target: { value } })
    fireEvent.blur(input)
    return input
  }

  it("avisa que la nota excede el límite y guarda el tope", () => {
    render(
      <CriterionScoreSheet classGroup={classGroup} criterion={criterion} />
    )

    const input = typeAndLeave("999")

    expect(toastWarning).toHaveBeenCalledWith(
      "999 excede el límite de 40; se registró 40."
    )
    expect(setScoreMutate).toHaveBeenCalledWith(
      expect.objectContaining({ score: 40 })
    )
    expect(input).toHaveValue(40)
  })

  it("no avisa cuando la nota está dentro del rango", () => {
    render(
      <CriterionScoreSheet classGroup={classGroup} criterion={criterion} />
    )

    typeAndLeave("30")

    expect(toastWarning).not.toHaveBeenCalled()
  })
})
