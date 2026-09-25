import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { InstitutionRiskTable } from "./InstitutionRiskTable"
import type { InstitutionRiskEntry } from "../types/risk"

const entry = (
  over: Partial<InstitutionRiskEntry> = {}
): InstitutionRiskEntry => ({
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
  pFail: 0.8723,
  attended: false,
  ...over,
})

describe("InstitutionRiskTable", () => {
  it("names the student, their classroom and the subject that put them on the list", () => {
    render(<InstitutionRiskTable rows={[entry()]} />)

    expect(screen.getByText("Quispe Ana")).toBeInTheDocument()
    expect(screen.getByText("Quinto B")).toBeInTheDocument()
    expect(screen.getByText("Matemática")).toBeInTheDocument()
    expect(screen.getByText("87.2%")).toBeInTheDocument()
    expect(screen.getByText("Riesgo crítico")).toBeInTheDocument()
  })

  /**
   * The place is the point of the list. A Director reading ten names with no numbers beside them
   * has to count rows to know who is worst.
   */
  it("shows the place each student holds", () => {
    render(
      <InstitutionRiskTable
        rows={[
          entry({ position: 1, fullName: "Quispe Ana" }),
          entry({
            position: 2,
            predictionId: "rp-2",
            studentId: "st-2",
            fullName: "Rojas Beto",
          }),
        ]}
      />
    )

    expect(screen.getByText("1")).toBeInTheDocument()
    expect(screen.getByText("2")).toBeInTheDocument()
  })

  /**
   * The API already answers worst first, and the order carries the places it numbered. Re-sorting
   * here would let the table show a row numbered 2 above one numbered 1.
   */
  it("keeps the order the list arrived in", () => {
    render(
      <InstitutionRiskTable
        rows={[
          entry({ position: 1, fullName: "Quispe Ana" }),
          entry({
            position: 2,
            predictionId: "rp-2",
            studentId: "st-2",
            fullName: "Rojas Beto",
            pFail: 0.99,
          }),
        ]}
      />
    )

    const names = screen
      .getAllByRole("row")
      .slice(1)
      .map((row) => row.querySelectorAll("td")[1]?.textContent)

    expect(names).toEqual(["Quispe Ana", "Rojas Beto"])
  })

  /** An empty list and a gestión nobody swept look the same without this. */
  it("says the list is empty rather than drawing an empty table", () => {
    render(<InstitutionRiskTable rows={[]} />)

    expect(screen.getByText(/Sin predicciones/)).toBeInTheDocument()
  })

  /**
   * Read-only by design. Dirección reads the whole school and teaches none of it, and the API
   * guards the write through the prediction's own subject — an offered button that always fails
   * is worse than no button.
   */
  it("offers no attend action, because Dirección teaches none of these subjects", () => {
    render(<InstitutionRiskTable rows={[entry()]} />)

    expect(
      screen.queryByRole("button", { name: /atendid/i })
    ).not.toBeInTheDocument()
  })
})
