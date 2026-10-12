import { describe, expect, it } from "vitest"

import {
  clampNotice,
  clampScore,
  draftText,
  mean,
  parseScore,
  scoreFromText,
} from "./scoreDraft"

describe("draftText", () => {
  it("falls back to the saved score when the cell was never touched", () => {
    expect(draftText({}, "ce-1:col-1", 12)).toBe("12")
  })

  it("returns an empty string when there is nothing typed and nothing saved", () => {
    expect(draftText({}, "ce-1:col-1", undefined)).toBe("")
  })

  it("keeps what the teacher typed even after the server sends a different score", () => {
    // El bug que arregla: un refetch mientras se escribe no puede pisar el tecleo.
    expect(draftText({ "ce-1:col-1": "7" }, "ce-1:col-1", 12)).toBe("7")
  })

  it("keeps an intentionally cleared cell empty instead of restoring the saved score", () => {
    // Vaciar la casilla es la forma de marcarla como no calificada.
    expect(draftText({ "ce-1:col-1": "" }, "ce-1:col-1", 12)).toBe("")
  })

  it("does not leak the draft of one cell into another", () => {
    expect(draftText({ "ce-1:col-1": "7" }, "ce-2:col-1", 12)).toBe("12")
  })

  it('renders a saved zero as "0", not as an empty cell', () => {
    expect(draftText({}, "ce-1:col-1", 0)).toBe("0")
  })
})

describe("clampScore", () => {
  it("leaves a score inside the range untouched", () => {
    expect(clampScore(7.5, 10)).toBe(7.5)
  })

  it("caps a score above the dimension maximum", () => {
    expect(clampScore(999, 45)).toBe(45)
  })

  it("raises a negative score to zero", () => {
    expect(clampScore(-3, 45)).toBe(0)
  })

  it("keeps the boundaries as valid values", () => {
    expect(clampScore(0, 45)).toBe(0)
    expect(clampScore(45, 45)).toBe(45)
  })
})

describe("scoreFromText", () => {
  it("reads a plain number", () => {
    expect(scoreFromText("7.5", 10)).toBe(7.5)
  })

  it("treats an empty or blank cell as not graded", () => {
    expect(scoreFromText("", 10)).toBeNull()
    expect(scoreFromText("   ", 10)).toBeNull()
  })

  it("treats text that is not a number as not graded instead of as a zero", () => {
    expect(scoreFromText("abc", 10)).toBeNull()
  })

  it("caps unconfirmed text so an average cannot exceed the dimension maximum", () => {
    // Sin esto, teclear 999 antes de salir del campo inflaba el promedio y el total.
    expect(scoreFromText("999", 5)).toBe(5)
  })

  it("reads a zero as a real score, not as an empty cell", () => {
    expect(scoreFromText("0", 10)).toBe(0)
  })
})

describe("mean", () => {
  it("averages the values it is given", () => {
    expect(mean([2, 4, 6])).toBe(4)
  })

  it("returns null when there is nothing to average", () => {
    expect(mean([])).toBeNull()
  })

  it("does not treat a single zero as an absent value", () => {
    expect(mean([0])).toBe(0)
  })
})

describe("parseScore", () => {
  it("reports a score inside the range as not clamped", () => {
    expect(parseScore("7.5", 10)).toEqual({ score: 7.5, clamped: false })
  })

  it("keeps the boundaries as unclamped values", () => {
    expect(parseScore("45", 45)).toEqual({ score: 45, clamped: false })
    expect(parseScore("0", 45)).toEqual({ score: 0, clamped: false })
  })

  it("flags a score above the cap as clamped to the cap", () => {
    expect(parseScore("999", 45)).toEqual({ score: 45, clamped: true })
  })

  it("flags a negative score as clamped to zero", () => {
    expect(parseScore("-3", 45)).toEqual({ score: 0, clamped: true })
  })

  it("returns null for empty or non-numeric text", () => {
    expect(parseScore("  ", 45)).toBeNull()
    expect(parseScore("abc", 45)).toBeNull()
  })
})

describe("clampNotice", () => {
  it("names the typed value, the cap and what was recorded", () => {
    expect(clampNotice("999", 45, 45)).toBe(
      "999 excede el límite de 45; se registró 45."
    )
  })

  it("explains a negative value raised to zero", () => {
    expect(clampNotice("-3", 0, 45)).toBe("-3 es menor que 0; se registró 0.")
  })
})
