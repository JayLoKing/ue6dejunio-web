import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { InstitutionRiskPanel } from "./InstitutionRiskPanel"

const useInstitutionRisk = vi.hoisted(() => vi.fn())

vi.mock("../hooks/useRisk", () => ({ useInstitutionRisk }))

const query = (over: Record<string, unknown> = {}) => ({
  data: undefined,
  isLoading: false,
  isError: false,
  ...over,
})

describe("InstitutionRiskPanel", () => {
  /**
   * The whole point of the screen. A fetch that failed and a gestión where nobody is at risk are
   * opposite facts, and the empty table says the second — so a Director reading a broken list would
   * conclude the school is fine on the day it is not.
   */
  it("says the list failed rather than drawing an empty one", () => {
    useInstitutionRisk.mockReturnValue(query({ isError: true }))

    render(
      <InstitutionRiskPanel academicYearId={7} trimester={1} places={10} />
    )

    expect(screen.getByText(/No se pudo cargar/)).toBeInTheDocument()
    expect(screen.queryByText(/Sin predicciones/)).not.toBeInTheDocument()
  })

  it("draws the list when it arrives", () => {
    useInstitutionRisk.mockReturnValue(
      query({
        data: [
          {
            position: 1,
            predictionId: "rp-1",
            studentId: "st-1",
            fullName: "Quispe Ana",
            courseId: "c-1",
            gradeName: "Quinto",
            parallelName: "B",
            classGroupId: "cg-1",
            subjectName: "Matemática",
            riskLevel: "RiesgoCritico",
            pFail: 0.9,
            attended: false,
          },
        ],
      })
    )

    render(
      <InstitutionRiskPanel academicYearId={7} trimester={1} places={10} />
    )

    expect(screen.getByText("Quispe Ana")).toBeInTheDocument()
  })

  /** An empty gestión is an answer, and it is not the same answer as a failure. */
  it("says the list is empty when the gestión really has nobody at risk", () => {
    useInstitutionRisk.mockReturnValue(query({ data: [] }))

    render(
      <InstitutionRiskPanel academicYearId={7} trimester={1} places={10} />
    )

    expect(screen.getByText(/Sin predicciones/)).toBeInTheDocument()
  })

  it("does not ask for a list when there is no gestión to ask about", () => {
    useInstitutionRisk.mockReturnValue(query())

    render(
      <InstitutionRiskPanel academicYearId={null} trimester={1} places={10} />
    )

    expect(screen.getByText(/Sin gestión activa/)).toBeInTheDocument()
  })
})
