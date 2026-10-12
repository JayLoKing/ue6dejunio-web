import { describe, expect, it } from "vitest"

import type { TextItem } from "./pdfParser"
import {
  normalizeGradeName,
  rosterHeaderFromItems,
  rosterHeaderMismatch,
} from "./rosterHeader"

const item = (str: string, x: number, y: number, width = 20): TextItem => ({
  str,
  x,
  y,
  width,
})

/**
 * The header of the SIE "Estudiantes inscritos por curso" roster as pdfjs hands it over: labels in
 * one column, values in the next, and the parallel's value sitting a point above its own label.
 * Coordinates mimic the real form; the school code and name are made up.
 */
const sieHeader = (
  grade = "Segundo",
  parallel = "A",
  title = "ESTUDIANTES INSCRITOS POR CURSO - GESTION 2026"
): TextItem[] => [
  item("SISTEMA DE INFORMACIÓN EDUCATIVA", 280, 555, 233),
  item("SUB SISTEMA DE EDUCACIÓN REGULAR", 288, 542, 217),
  item(title, 262, 528, 269),
  item("SIE:", 21, 481, 18),
  item("80000000", 89, 481, 40),
  item("Unidad Educativa:", 271, 481, 79),
  item("ESCUELA DE PRUEBA", 396, 481, 50),
  item("Nivel :", 21, 467, 27),
  item("Primaria Comunitaria Vocacional", 89, 467, 131),
  item("Grado:", 271, 467, 30),
  item(grade, 396, 467, 36),
  item(parallel, 89, 454, 6),
  item("MAÑANA", 396, 454, 39),
  item("Paralelo:", 21, 453, 38),
  item("Turno:", 271, 453, 28),
  item("No", 25, 415, 9),
  item("Código Rude", 54, 415, 41),
]

describe("normalizeGradeName", () => {
  it("names the grade the way the course catalogue does", () => {
    expect(normalizeGradeName("Segundo")).toBe("Segundo")
    expect(normalizeGradeName("PRIMERO")).toBe("Primero")
    expect(normalizeGradeName("  sexto ")).toBe("Sexto")
  })

  it("reads the abbreviated and numeric spellings", () => {
    expect(normalizeGradeName("1ro")).toBe("Primero")
    expect(normalizeGradeName("1er")).toBe("Primero")
    expect(normalizeGradeName("2do")).toBe("Segundo")
    expect(normalizeGradeName("3°")).toBe("Tercero")
    expect(normalizeGradeName("4to")).toBe("Cuarto")
    expect(normalizeGradeName("5")).toBe("Quinto")
    expect(normalizeGradeName("Tercer")).toBe("Tercero")
  })

  it("ignores the level written after the grade", () => {
    expect(normalizeGradeName("Primero de Secundaria")).toBe("Primero")
    expect(normalizeGradeName("1ro de Primaria")).toBe("Primero")
  })

  it("is robust to accents and case", () => {
    expect(normalizeGradeName("QUÍNTO")).toBe("Quinto")
  })

  it("answers nothing for a word that is no grade", () => {
    expect(normalizeGradeName("Séptimo")).toBeNull()
    expect(normalizeGradeName("")).toBeNull()
  })
})

describe("rosterHeaderFromItems", () => {
  it("reads grade, parallel and gestion from the SIE header", () => {
    expect(rosterHeaderFromItems(sieHeader())).toEqual({
      grade: "Segundo",
      parallel: "A",
      year: 2026,
    })
  })

  it("normalizes the grade and the parallel it reads", () => {
    expect(rosterHeaderFromItems(sieHeader("TERCERO", " b "))).toEqual({
      grade: "Tercero",
      parallel: "B",
      year: 2026,
    })
  })

  it("takes the value when pdfjs glues it to its label", () => {
    const items = sieHeader().filter(
      (it) => it.str !== "Grado:" && it.str !== "Segundo"
    )
    items.push(item("Grado: Cuarto", 271, 467, 70))

    expect(rosterHeaderFromItems(items)?.grade).toBe("Cuarto")
  })

  it("reads the gestion written with its accent", () => {
    expect(
      rosterHeaderFromItems(
        sieHeader(
          "Segundo",
          "A",
          "ESTUDIANTES INSCRITOS POR CURSO - GESTIÓN 2025"
        )
      )?.year
    ).toBe(2025)
  })

  // The whole-school list has no "Grado:" label: it mixes every course and cannot be one roster.
  it("answers nothing when the grade label is missing", () => {
    expect(
      rosterHeaderFromItems(sieHeader().filter((it) => it.str !== "Grado:"))
    ).toBeNull()
  })

  it("answers nothing when the parallel has no value", () => {
    expect(
      rosterHeaderFromItems(sieHeader().filter((it) => it.str !== "A"))
    ).toBeNull()
  })

  it("answers nothing when the gestion is missing", () => {
    expect(
      rosterHeaderFromItems(
        sieHeader("Segundo", "A", "ESTUDIANTES INSCRITOS POR CURSO")
      )
    ).toBeNull()
  })

  it("answers nothing when the grade is unrecognisable", () => {
    expect(rosterHeaderFromItems(sieHeader("Octavo"))).toBeNull()
  })
})

describe("rosterHeaderMismatch", () => {
  const course = { gradeName: "Segundo", parallelName: "A", year: 2026 }

  it("lets through a roster of the same course", () => {
    expect(
      rosterHeaderMismatch(
        { grade: "Segundo", parallel: "A", year: 2026 },
        course
      )
    ).toBeNull()
  })

  it("compares the course's names without regard to case or accents", () => {
    expect(
      rosterHeaderMismatch(
        { grade: "Segundo", parallel: "A", year: 2026 },
        { gradeName: "SEGUNDO", parallelName: "a", year: 2026 }
      )
    ).toBeNull()
  })

  it("refuses another grade", () => {
    expect(
      rosterHeaderMismatch(
        { grade: "Tercero", parallel: "A", year: 2026 },
        course
      )
    ).toBe(
      "Esta nómina no corresponde a tu curso (Tercero A 2026 ≠ Segundo A 2026)."
    )
  })

  it("refuses another parallel", () => {
    expect(
      rosterHeaderMismatch(
        { grade: "Segundo", parallel: "B", year: 2026 },
        course
      )
    ).toBe(
      "Esta nómina no corresponde a tu curso (Segundo B 2026 ≠ Segundo A 2026)."
    )
  })

  it("refuses another gestion", () => {
    expect(
      rosterHeaderMismatch(
        { grade: "Segundo", parallel: "A", year: 2025 },
        course
      )
    ).toBe(
      "Esta nómina no corresponde a tu curso (Segundo A 2025 ≠ Segundo A 2026)."
    )
  })

  it("refuses a roster whose header could not be read", () => {
    expect(rosterHeaderMismatch(null, course)).toBe(
      "No se pudo leer el curso y paralelo de la nómina; verifica que sea la nómina oficial."
    )
  })
})
