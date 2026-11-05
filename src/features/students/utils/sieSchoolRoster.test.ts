import { describe, expect, it } from "vitest"

import type { TextItem } from "./pdfParser"
import {
  isSchoolRosterPage,
  schoolRosterBlockFor,
  schoolRosterFromPages,
} from "./sieSchoolRoster"

const item = (str: string, x: number, y: number, width = 20): TextItem => ({
  str,
  x,
  y,
  width,
})

/**
 * The page header of the SIE "Estudiantes inscritos - Gestión" list of the whole school, as pdfjs
 * hands it over. Coordinates mimic the real file; the school code and name are made up.
 */
const pageHeader = (
  title = "ESTUDIANTES INSCRITOS - GESTIÓN 2026"
): TextItem[] => [
  item("SISTEMA DE INFORMACIÓN EDUCATIVA", 289, 553, 215),
  item("UNIDAD EDUCATIVA: 80000000 - ESCUELA DE PRUEBA", 289, 540, 215),
  item(title, 293, 526, 207),
  item("No", 23, 479, 9),
  item("Código Rude", 53, 479, 41),
  item("Sistema de Información Educativa", 21, 30, 106),
]

/** The headings that open a block: level, shift, year of schooling and parallel. */
const blockHeading = (
  y: number,
  level: string | null,
  year: number | null,
  parallel: string
): TextItem[] => [
  ...(level
    ? [item(level, 20, y + 38, 120), item("MAÑANA", 24, y + 25, 36)]
    : []),
  ...(year !== null
    ? [item(`Año de Escolaridad : ${year}`, 27, y + 12, 75)]
    : []),
  item(`Paralelo : ${parallel}`, 31, y, 39),
]

/** A student row; synthetic data only, the real list names minors. */
const row = (
  n: number,
  y: number,
  name: string,
  gender: "M" | "F" = "F"
): TextItem[] => [
  item(String(n), 24, y, 7),
  item(`80000000202600${String(n).padStart(2, "0")}`, 39, y, 53),
  item(`${1000000 + n}`, 110, y, 40),
  item(name, 170, y, 120),
  item(gender, 330, y, 6),
  item("9 de nov. de 2020", 380, y, 70),
  item("BOLIVIA", 470, y, 30),
]

/**
 * Three courses over two pages, numbered straight through like the real list: Inicial A, then
 * Inicial B starting mid-page 1 and running onto page 2, then Primaria year 2 A opening mid-page 2.
 * The second line of a wrapped birthplace sits on the same line as the "Paralelo : B" label.
 */
const page1: TextItem[] = [
  ...pageHeader(),
  ...blockHeading(416, "Inicial en Familia Comunitaria", 2, "A"),
  ...row(1, 404, "PEREZ ROJAS ANA"),
  ...row(2, 391, "QUISPE MAMANI LUIS", "M"),
  item("CHAPARE", 470, 378, 40),
  ...blockHeading(378, null, null, "B"),
  ...row(3, 366, "FLORES VARGAS ROSA"),
]

const page2: TextItem[] = [
  ...pageHeader(),
  ...blockHeading(416, "Inicial en Familia Comunitaria", 2, "B"),
  ...row(4, 404, "CHOQUE LOPEZ JUAN", "M"),
  ...blockHeading(353, "Primaria Comunitaria Vocacional", 2, "A"),
  ...row(5, 341, "MENDOZA CRUZ ELENA"),
  ...row(6, 328, "TORREZ VEGA MARIO", "M"),
]

/** The closing page counts students per shift and level; it is no course. */
const summaryPage: TextItem[] = [
  ...pageHeader(),
  item('NÚMERO DE ESTUDIANTES POR "ESTADO DE MATRÍCULA"', 18, 492, 483),
  item("MAÑANA", 35, 286, 30),
  item("Inicial en Familia", 92, 412, 52),
  item("Primaria Comunitaria", 85, 272, 66),
]

const roster = schoolRosterFromPages([page1, page2, summaryPage])

const names = (grade: string, parallel: string) =>
  roster.blocks
    .find((b) => b.grade === grade && b.parallel === parallel)
    ?.rows.map((r) => r.fullName)

describe("isSchoolRosterPage", () => {
  it("recognises the whole-school list by its year-of-schooling label", () => {
    expect(isSchoolRosterPage(page1)).toBe(true)
  })

  it("does not take a single-course roster for the whole-school list", () => {
    const singleCourse = [
      item("ESTUDIANTES INSCRITOS POR CURSO - GESTION 2026", 262, 528, 269),
      item("Grado:", 271, 467, 30),
      item("Segundo", 396, 467, 36),
      item("Paralelo:", 21, 453, 38),
      item("A", 89, 454, 6),
    ]
    expect(isSchoolRosterPage(singleCourse)).toBe(false)
  })
})

describe("schoolRosterFromPages", () => {
  it("reads the gestion from the page header", () => {
    expect(roster.year).toBe(2026)
  })

  it("finds one block per course, merging a course that runs onto the next page", () => {
    expect(roster.blocks.map((b) => `${b.grade} ${b.parallel}`)).toEqual([
      "Inicial A",
      "Inicial B",
      "Segundo A",
    ])
  })

  it("puts each student in the course whose heading precedes it", () => {
    expect(names("Inicial", "A")).toEqual([
      "PEREZ ROJAS ANA",
      "QUISPE MAMANI LUIS",
    ])
    expect(names("Inicial", "B")).toEqual([
      "FLORES VARGAS ROSA",
      "CHOQUE LOPEZ JUAN",
    ])
    expect(names("Segundo", "A")).toEqual([
      "MENDOZA CRUZ ELENA",
      "TORREZ VEGA MARIO",
    ])
  })

  it("numbers rows within the course, not through the whole list", () => {
    expect(
      roster.blocks
        .find((b) => b.grade === "Segundo")
        ?.rows.map((r) => r.rowIndex)
    ).toEqual([1, 2])
  })

  it("reads every field of a row with the single-course row parser", () => {
    expect(roster.blocks[0].rows[1]).toEqual({
      rowIndex: 2,
      rudeCode: "8000000020260002",
      identityCard: "1000002",
      names: "LUIS",
      lastNames: "QUISPE MAMANI",
      rawFullName: "QUISPE MAMANI LUIS",
      fullName: "QUISPE MAMANI LUIS",
      birthDate: "2020-11-09",
      gender: "M",
    })
  })

  it("maps the years of schooling of Primaria to the catalogue's grades", () => {
    const page = [
      ...pageHeader(),
      ...blockHeading(416, "Primaria Comunitaria Vocacional", 6, "C"),
      ...row(1, 404, "PEREZ ROJAS ANA"),
    ]
    expect(schoolRosterFromPages([page]).blocks[0]).toMatchObject({
      grade: "Sexto",
      parallel: "C",
    })
  })

  it("skips a level the catalogue has no grades for", () => {
    const page = [
      ...pageHeader(),
      ...blockHeading(416, "Secundaria Comunitaria Productiva", 1, "A"),
      ...row(1, 404, "PEREZ ROJAS ANA"),
    ]
    expect(schoolRosterFromPages([page]).blocks).toEqual([])
  })

  it("answers no gestion when the header does not carry one", () => {
    const page = [
      ...pageHeader("ESTUDIANTES INSCRITOS"),
      ...blockHeading(416, "Primaria Comunitaria Vocacional", 2, "A"),
      ...row(1, 404, "PEREZ ROJAS ANA"),
    ]
    expect(schoolRosterFromPages([page]).year).toBeNull()
  })
})

describe("schoolRosterBlockFor", () => {
  const course = { gradeName: "Segundo", parallelName: "A", year: 2026 }

  it("picks the block of the teacher's course, whatever the catalogue spelling", () => {
    const picked = schoolRosterBlockFor(roster, {
      gradeName: "SEGUNDO",
      parallelName: "a",
      year: 2026,
    })
    expect("block" in picked && picked.block.rows).toHaveLength(2)
  })

  it("picks an Inicial course", () => {
    const picked = schoolRosterBlockFor(roster, {
      gradeName: "Inicial",
      parallelName: "B",
      year: 2026,
    })
    expect("block" in picked && picked.block.rows).toHaveLength(2)
  })

  it("lists the courses found when the teacher's is missing", () => {
    expect(
      schoolRosterBlockFor(roster, { ...course, gradeName: "Tercero" })
    ).toEqual({
      error:
        "La nómina del SIE no tiene el curso Tercero A. Cursos encontrados: Inicial A, Inicial B, Segundo A.",
    })
  })

  it("refuses a list of another gestion", () => {
    expect(schoolRosterBlockFor(roster, { ...course, year: 2025 })).toEqual({
      error:
        "Esta nómina no corresponde a tu curso (Segundo A 2026 ≠ Segundo A 2025).",
    })
  })

  it("refuses a list whose gestion it could not read", () => {
    expect(
      schoolRosterBlockFor({ year: null, blocks: roster.blocks }, course)
    ).toEqual({
      error:
        "No se pudo leer la gestión de la nómina; verifica que sea la nómina oficial.",
    })
  })

  it("refuses a course whose block has no students", () => {
    const empty = {
      year: 2026,
      blocks: [{ grade: "Segundo", parallel: "A", rows: [] }],
    }
    expect(schoolRosterBlockFor(empty, course)).toEqual({
      error: "El curso Segundo A de la nómina no trae estudiantes.",
    })
  })

  it("says so when the list has no course at all", () => {
    expect(schoolRosterBlockFor({ year: 2026, blocks: [] }, course)).toEqual({
      error:
        "No se encontró ningún curso en la nómina del SIE. Verifica que sea la lista de estudiantes inscritos de la unidad educativa.",
    })
  })
})
