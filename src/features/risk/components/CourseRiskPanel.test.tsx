import { render, screen, within } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { ClassGroupRiskPanel } from "./ClassGroupRiskPanel"
import { CourseRiskPanel } from "./CourseRiskPanel"

const useCourseRisk = vi.hoisted(() => vi.fn())
const useClassGroupRisk = vi.hoisted(() => vi.fn())
const useMarkRiskAttended = vi.hoisted(() => vi.fn())
const usePredictClassGroupRisk = vi.hoisted(() => vi.fn())

vi.mock("../hooks/useRisk", () => ({
  useCourseRisk,
  useClassGroupRisk,
  useMarkRiskAttended,
  usePredictClassGroupRisk,
}))

const query = (over: Record<string, unknown> = {}) => ({
  data: undefined,
  isLoading: false,
  isError: false,
  ...over,
})

const mutation = { mutate: vi.fn(), isPending: false }

const risk = {
  id: "rp-1",
  studentId: "st-1",
  studentName: "Quispe Ana",
  classGroupId: "cg-1",
  subjectName: "Matemática",
  trimester: 1,
  riskLevel: "RiesgoCritico",
  pFail: 0.9,
  pOutstanding: 0.01,
  attended: false,
  predictedAt: "2026-09-11T10:00:00",
}

const passing = {
  ...risk,
  id: "rp-2",
  studentId: "st-2",
  studentName: "Rojas Beto",
  riskLevel: "EnRiesgo",
  pFail: 0.4,
}

describe("CourseRiskPanel", () => {
  /**
   * "Sin predicciones para este trimestre" is an answer about the course — nobody the model is
   * calling for. A failed request says nothing at all, and showing the same empty table for both
   * tells a teacher their students are fine on the day the list never loaded.
   */
  it("says the listing failed rather than drawing an empty one", () => {
    useCourseRisk.mockReturnValue(query({ isError: true }))
    useMarkRiskAttended.mockReturnValue(mutation)

    render(<CourseRiskPanel courseId="c-1" trimester={1} />)

    expect(screen.getByText(/No se pudo cargar/)).toBeInTheDocument()
    expect(screen.queryByText(/Sin predicciones/)).not.toBeInTheDocument()
  })

  it("draws the listing when it arrives", () => {
    useCourseRisk.mockReturnValue(query({ data: [risk] }))
    useMarkRiskAttended.mockReturnValue(mutation)

    render(<CourseRiskPanel courseId="c-1" trimester={1} />)

    expect(screen.getByText("Quispe Ana")).toBeInTheDocument()
  })

  /** An empty course is an answer, and it is not the same answer as a failure. */
  it("says the listing is empty when the course really has no predictions", () => {
    useCourseRisk.mockReturnValue(query({ data: [] }))
    useMarkRiskAttended.mockReturnValue(mutation)

    render(<CourseRiskPanel courseId="c-1" trimester={1} />)

    expect(screen.getByText(/Sin predicciones/)).toBeInTheDocument()
  })

  /**
   * The listing is of students who are really at risk, and the school draws that line at
   * RiesgoCritico. The cards above it still count every band: "how bad is it" needs all four.
   */
  it("lists only the critical rows while the cards count every band", () => {
    useCourseRisk.mockReturnValue(query({ data: [risk, passing] }))
    useMarkRiskAttended.mockReturnValue(mutation)

    render(<CourseRiskPanel courseId="c-1" trimester={1} />)

    expect(screen.getByText("Quispe Ana")).toBeInTheDocument()
    expect(screen.queryByText("Rojas Beto")).not.toBeInTheDocument()
    expect(
      within(screen.getByRole("group", { name: "En riesgo" })).getByText("1")
    ).toBeInTheDocument()
  })

  /** Predictions that hold nobody critical are a different answer from no predictions at all. */
  it("says nobody is in critical risk when every row is in a milder band", () => {
    useCourseRisk.mockReturnValue(query({ data: [passing] }))
    useMarkRiskAttended.mockReturnValue(mutation)

    render(<CourseRiskPanel courseId="c-1" trimester={1} />)

    expect(
      screen.getByText(/No hay estudiantes en riesgo crítico/)
    ).toBeInTheDocument()
    expect(screen.queryByText(/Sin predicciones/)).not.toBeInTheDocument()
  })
})

describe("CourseRiskPanel attend control", () => {
  // The notebook route (Director, Secretary) passes no ownedClassGroupIds: read-only for both.
  it("draws no attend control without ownedClassGroupIds", () => {
    useCourseRisk.mockReturnValue(query({ data: [risk] }))
    useMarkRiskAttended.mockReturnValue(mutation)

    render(<CourseRiskPanel courseId="c-1" trimester={1} />)

    expect(screen.getByText("Quispe Ana")).toBeInTheDocument()
    expect(
      screen.queryByRole("button", { name: /Marcar como/ })
    ).not.toBeInTheDocument()
  })

  it("draws it on a row the reader owns", () => {
    useCourseRisk.mockReturnValue(query({ data: [risk] }))
    useMarkRiskAttended.mockReturnValue(mutation)

    render(
      <CourseRiskPanel
        courseId="c-1"
        trimester={1}
        ownedClassGroupIds={["cg-1"]}
      />
    )

    expect(
      screen.getByRole("button", { name: /Marcar como atendida/ })
    ).toBeInTheDocument()
  })
})

describe("ClassGroupRiskPanel", () => {
  it("lists only the critical rows while the cards count every band", () => {
    useClassGroupRisk.mockReturnValue(query({ data: [risk, passing] }))
    useMarkRiskAttended.mockReturnValue(mutation)
    usePredictClassGroupRisk.mockReturnValue(mutation)

    render(<ClassGroupRiskPanel classGroupId="cg-1" trimester={1} />)

    expect(screen.getByText("Quispe Ana")).toBeInTheDocument()
    expect(screen.queryByText("Rojas Beto")).not.toBeInTheDocument()
    expect(
      within(screen.getByRole("group", { name: "En riesgo" })).getByText("1")
    ).toBeInTheDocument()
  })

  it("says nobody is in critical risk when every row is in a milder band", () => {
    useClassGroupRisk.mockReturnValue(query({ data: [passing] }))
    useMarkRiskAttended.mockReturnValue(mutation)
    usePredictClassGroupRisk.mockReturnValue(mutation)

    render(<ClassGroupRiskPanel classGroupId="cg-1" trimester={1} />)

    expect(
      screen.getByText(/No hay estudiantes en riesgo crítico/)
    ).toBeInTheDocument()
  })

  it("says the listing failed rather than drawing an empty one", () => {
    useClassGroupRisk.mockReturnValue(query({ isError: true }))
    useMarkRiskAttended.mockReturnValue(mutation)
    usePredictClassGroupRisk.mockReturnValue(mutation)

    render(<ClassGroupRiskPanel classGroupId="cg-1" trimester={1} />)

    expect(screen.getByText(/No se pudo cargar/)).toBeInTheDocument()
    expect(screen.queryByText(/Sin predicciones/)).not.toBeInTheDocument()
  })

  /**
   * The run button survives the failure. What broke is the reading of the standing rows; running
   * the model again is the very thing that might fix it, so taking the button away would strand
   * the teacher on a screen with nothing to do.
   */
  it("still offers to run the model when the listing failed", () => {
    useClassGroupRisk.mockReturnValue(query({ isError: true }))
    useMarkRiskAttended.mockReturnValue(mutation)
    usePredictClassGroupRisk.mockReturnValue(mutation)

    render(<ClassGroupRiskPanel classGroupId="cg-1" trimester={1} />)

    expect(
      screen.getByRole("button", { name: /Ejecutar modelo/ })
    ).toBeInTheDocument()
  })
})
