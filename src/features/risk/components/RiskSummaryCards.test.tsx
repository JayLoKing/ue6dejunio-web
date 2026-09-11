import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { RiskSummaryCards } from "./RiskSummaryCards"
import type { StudentRisk } from "../types/risk"

const risk = (over: Partial<StudentRisk> = {}): StudentRisk => ({
  id: "rp-1",
  studentId: "st-1",
  studentName: "Ana Quispe",
  classGroupId: "cg-1",
  subjectName: "Matemática",
  trimester: 1,
  riskLevel: "RiesgoCritico",
  pFail: 0.87,
  pOutstanding: 0.01,
  attended: false,
  predictedAt: "2026-09-11T10:00:00",
  ...over,
})

describe("RiskSummaryCards", () => {
  it("counts the four categories behind the listing", () => {
    render(
      <RiskSummaryCards
        rows={[
          risk({ id: "a", riskLevel: "RiesgoCritico" }),
          risk({ id: "b", riskLevel: "RiesgoCritico" }),
          risk({ id: "c", riskLevel: "EnRiesgo" }),
          risk({ id: "d", riskLevel: "Sobresaliente" }),
        ]}
      />
    )

    expect(
      screen.getByRole("group", { name: "Riesgo crítico" })
    ).toHaveTextContent("2")
    expect(screen.getByRole("group", { name: "En riesgo" })).toHaveTextContent(
      "1"
    )
    expect(
      screen.getByRole("group", { name: "Sobresaliente" })
    ).toHaveTextContent("1")
  })

  /**
   * The pending count is the only number that is a to-do list. It is said against the critical
   * total rather than alone, because "3" means nothing without "of 5".
   */
  it("says how many of the critical ones are still pending", () => {
    render(
      <RiskSummaryCards
        rows={[
          risk({ id: "a", attended: true }),
          risk({ id: "b" }),
          risk({ id: "c" }),
          risk({ id: "d", riskLevel: "SinRiesgo" }),
        ]}
      />
    )

    expect(
      screen.getByRole("group", { name: "Riesgo crítico" })
    ).toHaveTextContent("1 de 3 atendidos")
  })

  /** Zero students at risk is a result worth printing, not an empty strip. */
  it("shows zeros on a listing with nothing in it", () => {
    render(<RiskSummaryCards rows={[]} />)

    expect(
      screen.getByRole("group", { name: "Riesgo crítico" })
    ).toHaveTextContent("0")
  })
})
