import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { InstitutionRiskPanel } from "./InstitutionRiskPanel"

const useInstitutionRisk = vi.hoisted(() => vi.fn())

vi.mock("../hooks/useRisk", () => ({ useInstitutionRisk }))

// The panel now offers an export, and the document carries the school's letterhead. These scenarios
// are about the list, so the hook only has to answer without react-query behind it.
vi.mock("@/features/institution/hooks/useInstitution", () => ({
  useInstitution: () => ({ data: undefined, isLoading: false }),
}))

// The real button stays; beside it, the subtitles it was handed, which is the scope the document
// declares.
vi.mock("@/components/shared/ExportReportButton", async (importActual) => {
  const actual =
    await importActual<
      typeof import("@/components/shared/ExportReportButton")
    >()
  const { createElement, Fragment } = await import("react")
  return {
    ExportReportButton: (
      props: Parameters<typeof actual.ExportReportButton>[0]
    ) =>
      createElement(
        Fragment,
        null,
        createElement(actual.ExportReportButton, props),
        createElement("p", null, `subtitles:${props.subtitles.join("|")}`)
      ),
  }
})

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
    expect(
      screen.queryByText(/No hay estudiantes en riesgo crítico/)
    ).not.toBeInTheDocument()
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

    expect(
      screen.getByText(/No hay estudiantes en riesgo crítico/)
    ).toBeInTheDocument()
  })

  it("does not ask for a list when there is no gestión to ask about", () => {
    useInstitutionRisk.mockReturnValue(query())

    render(
      <InstitutionRiskPanel academicYearId={null} trimester={1} places={10} />
    )

    expect(screen.getByText(/Sin gestión activa/)).toBeInTheDocument()
  })
})

describe("InstitutionRiskPanel, export", () => {
  const atRisk = query({ data: [] })

  it("names the year in the document when it is known", () => {
    useInstitutionRisk.mockReturnValue(atRisk)

    render(
      <InstitutionRiskPanel
        academicYearId={7}
        trimester={2}
        places={10}
        year={2026}
      />
    )

    expect(
      screen.getByText(
        "subtitles:Alcance: unidad educativa|Gestión 2026|Trimestre 2"
      )
    ).toBeInTheDocument()
  })

  it("leaves the year line out instead of a bare 'Gestión' when it is unknown", () => {
    useInstitutionRisk.mockReturnValue(atRisk)

    render(
      <InstitutionRiskPanel
        academicYearId={7}
        trimester={2}
        places={10}
        year={null}
      />
    )

    expect(
      screen.getByText("subtitles:Alcance: unidad educativa|Trimestre 2")
    ).toBeInTheDocument()
  })
})
