import { render, screen } from "@testing-library/react"
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
})

describe("ClassGroupRiskPanel", () => {
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
