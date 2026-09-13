import { Packer } from "docx"
import JSZip from "jszip"
import { beforeAll, describe, expect, it } from "vitest"

import type { Institution } from "@/features/institution/types"

import { reportCardDocxOf } from "./reportCardDocx"
import type {
  ReportCardArea,
  ReportCardField,
  StudentReportCard,
} from "../types"

const area = (over: Partial<ReportCardArea> = {}): ReportCardArea => ({
  classGroupId: "cg-1",
  subjectName: "Comunicación y Lenguajes",
  trimester1: 78,
  trimester2: 81,
  trimester3: 85,
  average: 81.33,
  ...over,
})

const field = (over: Partial<ReportCardField> = {}): ReportCardField => ({
  fieldName: "Comunidad y Sociedad",
  displayOrder: 1,
  areas: [area()],
  ...over,
})

const card = (over: Partial<StudentReportCard> = {}): StudentReportCard => ({
  courseEnrollmentId: "ce-1",
  studentId: "st-1",
  rudeCode: "80123456789",
  fullName: "Juan Carlos Vargas Rojas",
  gradeName: "Quinto",
  parallelName: "B",
  year: 2026,
  fields: [field()],
  trimesterAverages: [78, 81, 85],
  finalAverage: 81.33,
  finalAverageInWords: "ochenta y uno",
  trimesterOutcomes: [
    { trimester: 1, passedAreas: 4, failedAreas: 0 },
    { trimester: 2, passedAreas: 3, failedAreas: 1 },
    { trimester: 3, passedAreas: 4, failedAreas: 0 },
  ],
  ...over,
})

const school: Institution = {
  district: "Sacaba",
  school: 'Unidad Educativa "6 de Junio"',
  directorName: "Luis Rojas",
  department: "Cochabamba",
  dependency: "Fiscal",
  shift: "Mañana",
  educationLevel: "Educación Primaria Comunitaria Vocacional",
}

/** The text the file actually carries, read back out of the package the way Word reads it. */
async function documentXmlOf(
  ...args: Parameters<typeof reportCardDocxOf>
): Promise<string> {
  const buffer = await Packer.toBuffer(reportCardDocxOf(...args))
  const zip = await JSZip.loadAsync(buffer)
  const xml = await zip.file("word/document.xml")?.async("string")
  return xml ?? ""
}

describe("reportCardDocxOf", () => {
  let xml: string

  beforeAll(async () => {
    xml = await documentXmlOf({ card: card(), school })
  })

  // A .docx is a package, not an HTML file under another name. Word opens markup renamed to .doc,
  // but no other reader treats it as a document.
  it("packs a real Office document", async () => {
    const buffer = await Packer.toBuffer(
      reportCardDocxOf({ card: card(), school })
    )
    const zip = await JSZip.loadAsync(buffer)

    expect(zip.file("word/document.xml")).not.toBeNull()
    expect(zip.file("[Content_Types].xml")).not.toBeNull()
  })

  // Portrait, unlike the PDC: the libreta is a column of areas, not a weekly grid.
  it("sets the page up the way the printed sheet is set up", () => {
    expect(xml).not.toContain('w:orient="landscape"')
  })

  it("heads the sheet the way the school heads it", () => {
    expect(xml).toContain("LIBRETA ESCOLAR")
    expect(xml).toContain("Educación Primaria Comunitaria Vocacional")
  })

  it("carries the whole heading the official documents carry", () => {
    expect(xml).toContain("6 de Junio")
    expect(xml).toContain("Cochabamba")
    expect(xml).toContain("Sacaba")
    expect(xml).toContain("Fiscal")
    expect(xml).toContain("Mañana")
    expect(xml).toContain("2026")
  })

  it("names the student the sheet belongs to", () => {
    expect(xml).toContain("80123456789")
    expect(xml).toContain("Juan Carlos Vargas Rojas")
    expect(xml).toContain("Quinto")
  })

  it("prints every area under its own field of knowledge", () => {
    expect(xml).toContain("Comunidad y Sociedad")
    expect(xml).toContain("Comunicación y Lenguajes")
    expect(xml).toContain("78.00")
    expect(xml).toContain("81.00")
    expect(xml).toContain("85.00")
    expect(xml).toContain("81.33")
  })

  /*
   * An area whose group was deactivated has no field. Its marks are printed anyway — they were
   * given, and a libreta that loses a subject in silence is worse than one with an untitled row.
   */
  it("still prints the areas that lost their field", async () => {
    const orphan = await documentXmlOf({
      card: card({ fields: [field({ fieldName: null, displayOrder: null })] }),
      school,
    })

    expect(orphan).toContain("Otras áreas")
    expect(orphan).toContain("Comunicación y Lenguajes")
  })

  /*
   * A mark the school never wrote reads as a dash, never as a zero: an area that starts mid-year
   * has no mark before it existed, and a 0 there reads as a failed subject nobody taught.
   */
  it("writes a mark that was never given as a dash", async () => {
    const partial = await documentXmlOf({
      card: card({ fields: [field({ areas: [area({ trimester1: null })] })] }),
      school,
    })

    expect(partial).toContain("—")
  })

  it("closes with the trimester averages and the annual one", () => {
    expect(xml).toContain("Promedio Trimestral")
    // The annual average carries no decimals on the printed sheet, the way the school signs it.
    expect(xml).toContain(">81<")
    expect(xml).toContain("Total de Áreas Reprobadas")
  })

  it("writes the annual average in words too", () => {
    expect(xml).toContain("ochenta y uno")
  })

  it("leaves the two signature lines the sheet is signed on", () => {
    expect(xml).toContain("Firma del Asesor(a)")
    expect(xml).toContain("Firma del Director U.E.")
    expect(xml).toContain("Luis Rojas")
  })

  /*
   * The line is printed with no Director in office; what it cannot carry is the name of somebody
   * who does not hold the post.
   */
  it("signs without a name when there is no Director in office", async () => {
    const headless = await documentXmlOf({
      card: card(),
      school: { ...school, directorName: "" },
    })

    expect(headless).toContain("Firma del Director U.E.")
    expect(headless).not.toContain("Luis Rojas")
  })

  it("says so when nothing was graded", async () => {
    const blank = await documentXmlOf({
      card: card({
        fields: [],
        trimesterAverages: [null, null, null],
        finalAverage: null,
        finalAverageInWords: "",
        trimesterOutcomes: [],
      }),
      school,
    })

    expect(blank).toContain("Sin áreas calificadas.")
  })
})
