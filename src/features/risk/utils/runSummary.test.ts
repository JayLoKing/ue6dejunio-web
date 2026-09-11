import { describe, expect, it } from "vitest"

import { describeRun } from "./runSummary"
import type { RunSummary } from "../types/risk"

const run = (over: Partial<RunSummary> = {}): RunSummary => ({
  considered: 30,
  skipped: 0,
  predicted: 30,
  changed: 4,
  ...over,
})

describe("describeRun", () => {
  /**
   * A run that predicted nothing is the normal case in the first weeks: the model needs a mark in
   * all four dimensions. Reporting it as success would tell a teacher the model ran on students it
   * never saw, and they would trust an empty column as good news.
   */
  it("says nobody was ready rather than claiming a successful run", () => {
    expect(
      describeRun(
        run({ considered: 30, skipped: 30, predicted: 0, changed: 0 })
      )
    ).toEqual({
      tone: "info",
      message:
        "Ningún estudiante tiene las cuatro dimensiones calificadas todavía. No se predijo a nadie.",
    })
  })

  /** Nothing to look at is not the same as nothing being ready. */
  it("separates an empty roster from a roster nobody has graded", () => {
    expect(
      describeRun(run({ considered: 0, skipped: 0, predicted: 0, changed: 0 }))
    ).toEqual({
      tone: "info",
      message: "No hay estudiantes para evaluar.",
    })
  })

  it("reports a run where no category moved", () => {
    expect(
      describeRun(
        run({ considered: 30, skipped: 0, predicted: 30, changed: 0 })
      )
    ).toEqual({
      tone: "info",
      message:
        "30 estudiantes evaluados. Ninguna predicción cambió de categoría.",
    })
  })

  it("reports how many categories moved, which is what anyone was told about", () => {
    expect(
      describeRun(
        run({ considered: 30, skipped: 0, predicted: 30, changed: 4 })
      )
    ).toEqual({
      tone: "success",
      message:
        "30 estudiantes evaluados. 4 predicciones cambiaron de categoría.",
    })
  })

  it("keeps the singular readable", () => {
    expect(
      describeRun(run({ considered: 1, skipped: 0, predicted: 1, changed: 1 }))
        .message
    ).toBe("1 estudiante evaluado. 1 predicción cambió de categoría.")
  })

  /**
   * The skipped ones are the reason a roster of 30 shows 22 rows. Left unsaid, the gap reads as a
   * bug in the panel instead of eight students nobody has finished grading.
   */
  it("keeps the skipped count readable when it is a single student", () => {
    expect(
      describeRun(run({ considered: 2, skipped: 1, predicted: 1, changed: 0 }))
        .message
    ).toBe(
      "1 estudiante evaluado. Ninguna predicción cambió de categoría. 1 quedó fuera por no tener las cuatro dimensiones calificadas."
    )
  })

  it("names the students it had to skip so the gap is not read as a fault", () => {
    expect(
      describeRun(
        run({ considered: 30, skipped: 8, predicted: 22, changed: 3 })
      ).message
    ).toBe(
      "22 estudiantes evaluados. 3 predicciones cambiaron de categoría. 8 quedaron fuera por no tener las cuatro dimensiones calificadas."
    )
  })
})
