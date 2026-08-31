import { describe, expect, it } from "vitest"

import {
  parseSpanishDate,
  splitFullName,
  studentRowsFromItems,
  type TextItem,
} from "./pdfParser"

const item = (str: string, x: number, y: number, width = 20): TextItem => ({
  str,
  x,
  y,
  width,
})

/**
 * Una fila de la nómina SIE tal como cae en el PDF: número a la izquierda, después RUDE, carnet,
 * el nombre, la M o la F, y la fecha al final.
 */
const row = (
  n: string,
  y: number,
  rude: string,
  carnet: string,
  name: string,
  gender: string,
  date: string
): TextItem[] => [
  item(n, 20, y),
  item(rude, 80, y, 60),
  item(carnet, 180, y, 40),
  item(name, 260, y, 120),
  item(gender, 420, y, 10),
  item(date, 460, y, 90),
]

describe("parseSpanishDate", () => {
  it("reads the date the way the form prints it", () => {
    expect(parseSpanishDate("5 de marzo de 2014")).toBe("2014-03-05")
  })

  it("takes an abbreviated month, with or without its dot", () => {
    expect(parseSpanishDate("12 de sep. de 2013")).toBe("2013-09-12")
    expect(parseSpanishDate("12 de sep de 2013")).toBe("2013-09-12")
  })

  it("answers nothing rather than a wrong date", () => {
    expect(parseSpanishDate("5 de brumario de 2014")).toBeNull()
    expect(parseSpanishDate("05/03/2014")).toBeNull()
  })
})

describe("splitFullName", () => {
  // The nomina writes surnames first, and a Bolivian record carries two of them.
  it("takes the first two tokens as surnames", () => {
    expect(splitFullName("QUISPE MAMANI ANA MARIA")).toEqual({
      lastNames: "QUISPE MAMANI",
      names: "ANA MARIA",
      fullName: "QUISPE MAMANI ANA MARIA",
    })
  })

  it("reads one surname and one name when that is all there is", () => {
    expect(splitFullName("QUISPE ANA")).toEqual({
      lastNames: "QUISPE",
      names: "ANA",
      fullName: "QUISPE ANA",
    })
  })

  it("keeps a lone token as the surname", () => {
    expect(splitFullName("  QUISPE  ")).toEqual({
      lastNames: "QUISPE",
      names: "",
      fullName: "QUISPE",
    })
  })
})

describe("studentRowsFromItems", () => {
  it("reads a student out of the page", () => {
    const rows = studentRowsFromItems(
      row(
        "1",
        700,
        "1234567890123",
        "9876543",
        "QUISPE MAMANI ANA",
        "F",
        "5 de marzo de 2014"
      ),
      0
    )

    expect(rows).toEqual([
      {
        rowIndex: 1,
        rudeCode: "1234567890123",
        identityCard: "9876543",
        names: "ANA",
        lastNames: "QUISPE MAMANI",
        rawFullName: "QUISPE MAMANI ANA",
        fullName: "QUISPE MAMANI ANA",
        birthDate: "2014-03-05",
        gender: "F",
      },
    ])
  })

  // Rows are grouped by how far apart their anchors sit, so two of them must not bleed together.
  it("keeps neighbouring rows apart", () => {
    const rows = studentRowsFromItems(
      [
        ...row(
          "1",
          700,
          "1234567890123",
          "9876543",
          "QUISPE MAMANI ANA",
          "F",
          "5 de marzo de 2014"
        ),
        ...row(
          "2",
          660,
          "3210987654321",
          "1234567",
          "ROJAS PEREZ LUIS",
          "M",
          "9 de julio de 2013"
        ),
      ],
      0
    )

    expect(rows.map((r) => r.fullName)).toEqual([
      "QUISPE MAMANI ANA",
      "ROJAS PEREZ LUIS",
    ])
    expect(rows.map((r) => r.gender)).toEqual(["F", "M"])
  })

  // A name wraps onto a second line inside the same row band, and has to arrive as one name.
  it("joins a name split across two lines of the same row", () => {
    const rows = studentRowsFromItems(
      [
        ...row(
          "1",
          700,
          "1234567890123",
          "9876543",
          "QUISPE MAMANI",
          "F",
          "5 de marzo de 2014"
        ),
        item("ANA MARIA", 260, 694, 120),
      ],
      0
    )

    expect(rows[0].fullName).toBe("QUISPE MAMANI ANA MARIA")
    expect(rows[0].names).toBe("ANA MARIA")
  })

  // The list runs across pages, and the teacher reads one list.
  it("carries the numbering on from the previous page", () => {
    const rows = studentRowsFromItems(
      row(
        "1",
        700,
        "1234567890123",
        "9876543",
        "QUISPE MAMANI ANA",
        "F",
        "5 de marzo de 2014"
      ),
      30
    )

    expect(rows[0].rowIndex).toBe(31)
  })

  it("skips a row whose date it cannot read rather than inventing one", () => {
    const rows = studentRowsFromItems(
      row(
        "1",
        700,
        "1234567890123",
        "9876543",
        "QUISPE MAMANI ANA",
        "F",
        "sin fecha"
      ),
      0
    )

    expect(rows).toEqual([])
  })

  it("returns nothing for a page with no numbered rows", () => {
    expect(studentRowsFromItems([item("Cabecera", 300, 780)], 0)).toEqual([])
  })
})
