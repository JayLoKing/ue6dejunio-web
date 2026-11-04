import { describe, expect, it } from "vitest"

import {
  nominaBlockFor,
  nominaBlocksFromSheet,
  sharedStringsFromXml,
  splitNominaName,
} from "./nominaXlsx"

const NS = 'xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"'

const shared = (items: string[]) =>
  `<?xml version="1.0"?><sst ${NS}>${items
    .map((s) => `<si><t>${s}</t></si>`)
    .join("")}</sst>`

/** A cell that points at the shared string table. */
const s = (ref: string, index: number) =>
  `<c r="${ref}" t="s"><v>${index}</v></c>`
/** A cell that carries its text inline. */
const inline = (ref: string, text: string) =>
  `<c r="${ref}" t="inlineStr"><is><t>${text}</t></is></c>`
const num = (ref: string, n: number) => `<c r="${ref}"><v>${n}</v></c>`
const empty = (ref: string) => `<c r="${ref}" s="2"/>`

const row = (r: number, cells: string) => `<row r="${r}">${cells}</row>`
const sheet = (rows: string[]) =>
  `<?xml version="1.0"?><worksheet ${NS}><sheetData>${rows.join(
    ""
  )}</sheetData><mergeCells><mergeCell ref="B1:G1"/></mergeCells></worksheet>`

describe("sharedStringsFromXml", () => {
  it("joins the runs of a rich-text entry", () => {
    const xml = `<sst ${NS}><si><t>PLAIN</t></si><si><r><t>RICH </t></r><r><t>TEXT</t></r></si></sst>`

    expect(sharedStringsFromXml(xml)).toEqual(["PLAIN", "RICH TEXT"])
  })
})

describe("nominaBlocksFromSheet", () => {
  // Synthetic names only: the real file lists minors.
  const strings = shared([
    "NOMINA DE ESTUDIANTES  GESTION -2025", // 0
    "CURSO:  INICIAL    A", // 1
    "PEREZ ROJAS ANA LUCIA", // 2
    "CURSO:  PRIMERO    B", // 3
    "No", // 4
    "APELLIDOS Y NOMBRES", // 5
    "QUISPE MAMANI LUIS", // 6
    "NUEVO", // 7
    "CURSO:  CUARTOC   C", // 8
    "LOPEZ JUAN", // 9
  ])

  const xml = sheet([
    row(1, s("B1", 0) + empty("C1") + empty("G1")),
    row(2, s("B2", 1)),
    // INICIAL block: no "No | APELLIDOS Y NOMBRES" header row.
    row(3, num("A3", 1) + s("B3", 2)),
    row(4, num("A4", 2) + inline("B4", "FLORES  VARGAS  PEDRO")),
    // A numbered row whose name is empty: skipped.
    row(5, num("A5", 3) + empty("B5")),
    row(7, s("B7", 0)),
    row(8, s("B8", 3)),
    row(9, s("A9", 4) + s("B9", 5)),
    // A note in column C is ignored.
    row(10, num("A10", 1) + s("B10", 6) + s("C10", 7)),
    // A name with no number is kept.
    row(11, inline("B11", "CHOQUE ROSA")),
    row(13, s("B13", 8)),
    row(14, num("A14", 4) + s("B14", 9)),
    row(15, num("A15", 6) + inline("B15", "SOLO")),
  ])

  const blocks = nominaBlocksFromSheet(xml, sharedStringsFromXml(strings))

  it("finds one block per course line, tolerating a glued parallel letter", () => {
    expect(blocks.map((b) => `${b.grade} ${b.parallel}`)).toEqual([
      "Inicial A",
      "Primero B",
      "Cuarto C",
    ])
  })

  it("reads shared and inline names, skips empty names and header rows", () => {
    expect(blocks[0].rows.map((r) => r.fullName)).toEqual([
      "PEREZ ROJAS ANA LUCIA",
      "FLORES VARGAS PEDRO",
    ])
    expect(blocks[1].rows.map((r) => r.fullName)).toEqual([
      "QUISPE MAMANI LUIS",
      "CHOQUE ROSA",
    ])
  })

  it("numbers rows within the block and leaves identity fields out", () => {
    const [first] = blocks[0].rows
    expect(first).toEqual({
      rowIndex: 1,
      rawFullName: "PEREZ ROJAS ANA LUCIA",
      fullName: "PEREZ ROJAS ANA LUCIA",
      lastNames: "PEREZ ROJAS",
      names: "ANA LUCIA",
    })
    expect(blocks[1].rows[1].rowIndex).toBe(2)
  })

  it("rejects a one-word name with a visible note", () => {
    expect(blocks[2].rows.map((r) => r.fullName)).toEqual(["LOPEZ JUAN"])
    expect(blocks[2].rejected).toEqual([
      {
        rowNumber: 15,
        rawFullName: "SOLO",
        reason:
          "Tiene una sola palabra: no se pueden separar apellidos y nombres.",
      },
    ])
  })
})

describe("splitNominaName", () => {
  it("takes the first two words as surnames when there are three or more", () => {
    expect(splitNominaName("MAMANI CRUZ JOSE LUIS")).toEqual({
      lastNames: "MAMANI CRUZ",
      names: "JOSE LUIS",
    })
  })

  it("splits two words one and one", () => {
    expect(splitNominaName("CRUZ ANA")).toEqual({
      lastNames: "CRUZ",
      names: "ANA",
    })
  })

  it("refuses a single word", () => {
    expect(splitNominaName("  ANA ")).toBeNull()
  })
})

describe("nominaBlockFor", () => {
  const blocks = [
    { grade: "Inicial", parallel: "A", rows: [], rejected: [] },
    { grade: "Primero", parallel: "B", rows: [], rejected: [] },
  ]

  it("picks the block of the course, whatever the catalog spelling", () => {
    expect(
      nominaBlockFor(blocks, { gradeName: "PRIMERO", parallelName: "b" })
    ).toEqual({ block: blocks[1] })
    expect(
      nominaBlockFor(blocks, { gradeName: "Inicial", parallelName: "A" })
    ).toEqual({ block: blocks[0] })
  })

  it("lists the courses found when none matches", () => {
    expect(
      nominaBlockFor(blocks, { gradeName: "Segundo", parallelName: "A" })
    ).toEqual({
      error:
        "La planilla no tiene el curso Segundo A. Cursos encontrados: Inicial A, Primero B.",
    })
  })

  it("says so when the sheet has no course at all", () => {
    expect(
      nominaBlockFor([], { gradeName: "Segundo", parallelName: "A" })
    ).toEqual({
      error:
        "No se encontró ningún curso en la planilla. Verifica que sea la nómina de estudiantes (líneas «CURSO: …»).",
    })
  })
})
