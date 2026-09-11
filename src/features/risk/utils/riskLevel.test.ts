import { describe, expect, it } from "vitest"

import {
  RISK_LEVELS,
  formatProbability,
  riskLevelLabel,
  riskLevelSeverity,
  riskLevelTone,
  summarizeRisk,
} from "./riskLevel"
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

describe("riskLevelLabel", () => {
  it("spells the four categories the way the school says them", () => {
    expect(riskLevelLabel("RiesgoCritico")).toBe("Riesgo crítico")
    expect(riskLevelLabel("EnRiesgo")).toBe("En riesgo")
    expect(riskLevelLabel("SinRiesgo")).toBe("Sin riesgo")
    expect(riskLevelLabel("Sobresaliente")).toBe("Sobresaliente")
  })

  /**
   * Retraining the model with a fifth category must not print an empty cell. The raw name is
   * useless to a teacher but it is true, and it says out loud that the web is behind the model.
   */
  it("shows a category it was never taught instead of blanking the cell", () => {
    expect(riskLevelLabel("Desconocido")).toBe("Desconocido")
  })
})

describe("riskLevelSeverity", () => {
  /**
   * The API already answers worst first. This exists because the panel merges several class
   * groups into one listing and lets the reader sort it, and at that point the order is the
   * client's problem: these four words do not sort into severity alphabetically.
   */
  it("ranks the four categories worst first", () => {
    const ranked = [...RISK_LEVELS].sort(
      (a, b) => riskLevelSeverity(a) - riskLevelSeverity(b)
    )

    expect(ranked).toEqual([
      "RiesgoCritico",
      "EnRiesgo",
      "SinRiesgo",
      "Sobresaliente",
    ])
  })

  /** An unknown category sorts last rather than first: it is not evidence of danger. */
  it("sorts a category it does not know below every known one", () => {
    expect(riskLevelSeverity("Desconocido")).toBeGreaterThan(
      riskLevelSeverity("Sobresaliente")
    )
  })
})

describe("riskLevelTone", () => {
  /**
   * Only the failing category is loud. `EnRiesgo` is the largest group in the training data, so
   * painting it red would paint most of the school red and the colour would stop meaning anything.
   */
  it("reserves the alarming tone for the category that is actually failing", () => {
    expect(riskLevelTone("RiesgoCritico")).toBe("critical")
    expect(riskLevelTone("EnRiesgo")).toBe("warning")
    expect(riskLevelTone("SinRiesgo")).toBe("neutral")
    expect(riskLevelTone("Sobresaliente")).toBe("positive")
    expect(riskLevelTone("Desconocido")).toBe("neutral")
  })
})

describe("formatProbability", () => {
  /**
   * The column stores 0 to 1 and a teacher reads percentages. The decimal separator is a dot to
   * match the grades this sits beside in the score sheet, which go through `round1` and render
   * as plain numbers — two separators in one row would read as two different kinds of number.
   */
  it("reads the stored fraction as a percentage with one decimal", () => {
    expect(formatProbability(0.8723)).toBe("87.2%")
    expect(formatProbability(0)).toBe("0.0%")
    expect(formatProbability(1)).toBe("100.0%")
  })
})

describe("summarizeRisk", () => {
  it("counts each category and how many were already acted on", () => {
    const summary = summarizeRisk([
      risk({ id: "a", riskLevel: "RiesgoCritico", attended: true }),
      risk({ id: "b", riskLevel: "RiesgoCritico" }),
      risk({ id: "c", riskLevel: "EnRiesgo" }),
      risk({ id: "d", riskLevel: "SinRiesgo" }),
      risk({ id: "e", riskLevel: "Sobresaliente" }),
    ])

    expect(summary).toEqual({
      total: 5,
      critical: 2,
      warning: 1,
      none: 1,
      outstanding: 1,
      attended: 1,
    })
  })

  /**
   * `attended` only counts where it means something. A student the model cleared was never
   * anybody's pending task, so counting them as handled would report work that never existed.
   */
  it("counts as acted on only the ones that demanded acting", () => {
    const summary = summarizeRisk([
      risk({ id: "a", riskLevel: "SinRiesgo", attended: true }),
      risk({ id: "b", riskLevel: "RiesgoCritico", attended: true }),
    ])

    expect(summary.attended).toBe(1)
  })

  it("reports zeros rather than nothing on an empty listing", () => {
    expect(summarizeRisk([])).toEqual({
      total: 0,
      critical: 0,
      warning: 0,
      none: 0,
      outstanding: 0,
      attended: 0,
    })
  })
})
