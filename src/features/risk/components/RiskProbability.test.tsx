import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { RiskProbability } from "./RiskProbability"
import type { StudentRisk } from "../types/risk"

const risk = (over: Partial<StudentRisk> = {}): StudentRisk => ({
  id: "rp-1",
  studentId: "st-1",
  studentName: "Ana Quispe",
  classGroupId: "cg-1",
  subjectName: "Matemática",
  trimester: 1,
  riskLevel: "RiesgoCritico",
  pFail: 0.8723,
  pOutstanding: 0.0102,
  attended: false,
  predictedAt: "2026-09-11T10:00:00",
  ...over,
})

describe("RiskProbability", () => {
  it("reads the probability as a percentage and names the category behind it", () => {
    render(<RiskProbability risk={risk()} />)

    const cell = screen.getByText("87.2%")
    expect(cell).toBeInTheDocument()
    expect(cell).toHaveAttribute(
      "title",
      expect.stringContaining("Riesgo crítico")
    )
  })

  /**
   * A student the model could not evaluate is the normal case early in the trimester: it needs a
   * mark in all four dimensions. A dash says there is nothing there; a blank cell would read as a
   * zero probability, which is the opposite of "unknown".
   */
  it("shows a dash where the model has not predicted the student", () => {
    render(<RiskProbability risk={undefined} />)

    expect(screen.getByText("—")).toBeInTheDocument()
  })

  it("says it is still loading rather than claiming there is no prediction", () => {
    render(<RiskProbability risk={undefined} isLoading />)

    expect(screen.queryByText("—")).not.toBeInTheDocument()
    expect(screen.getByRole("status")).toBeInTheDocument()
  })
})
