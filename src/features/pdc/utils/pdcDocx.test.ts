import { Packer } from "docx"
import JSZip from "jszip"
import { beforeAll, describe, expect, it } from "vitest"

import { pdcDocxOf } from "./pdcDocx"
import type { Pdc, PdcEntry, PdcSubject } from "../types"
import type { Adaptation } from "@/features/adaptation/types"

const week = (over: Partial<PdcEntry> = {}): PdcEntry =>
  ({
    id: "e-1",
    weekLabel: "Semana 1",
    contents: "T 7 La poesía",
    practice: "Leemos poemas",
    theory: "Explicamos la rima",
    valuation: "Valoramos la palabra",
    production: "Esquema del poema",
    resources: "Periódicos",
    periods: 11,
    criteriaBeing: "Respeta opiniones",
    criteriaKnowing: "Reconoce la estructura",
    criteriaDoing: "Elabora un esquema",
    displayOrder: 0,
    ...over,
  }) as PdcEntry

const subject = (over: Partial<PdcSubject> = {}): PdcSubject =>
  ({
    id: "s-1",
    classGroupId: "cg-1",
    subjectName: "Comunicación y Lenguajes",
    knowledgeArea: "Comunidad y Sociedad",
    teacherId: "t-1",
    teacherName: "Ana Pérez",
    learningObjective: "Desarrollamos la lectura comprensiva.",
    generalAdaptations: "Material manipulable.",
    displayOrder: 0,
    entries: [week()],
    ...over,
  }) as PdcSubject

const plan = (over: Partial<Pdc> = {}): Pdc =>
  ({
    id: "p-1",
    planNumber: 4,
    trimester: 2,
    periodStart: "2026-08-03",
    periodEnd: "2026-09-04",
    status: "Approved",
    courseName: 'Quinto "B"',
    levelName: "Primaria Comunitaria Vocacional",
    homeroomTeacherName: "Ana Pérez",
    holisticObjective: "Fortalecemos la práctica de valores.",
    finalProduct: "Antología de poemas",
    bibliography: "Currículo Base 2023",
    subjects: [subject()],
    ...over,
  }) as Pdc

const adaptation = (over: Partial<Adaptation> = {}): Adaptation =>
  ({
    id: "a-1",
    planId: "p-1",
    studentId: "st-1",
    studentName: "Juan Carlos Vargas Rojas",
    conditionType: "TEA",
    adaptedContents: "Números hasta el 20",
    adaptedMethodology: "Material concreto",
    adaptedCriteria: "Cuenta con apoyo",
    createdById: null,
    updatedById: null,
    createdAt: "2026-08-03T00:00:00",
    updatedAt: "2026-08-03T00:00:00",
    ...over,
  }) as Adaptation

const institution = {
  district: "Sacaba",
  school: 'Unidad Educativa "6 de Junio"',
  directorName: "Luis Rojas",
  // The PDC prints none of these four; the libreta and the informe pedagógico do, and the heading
  // is one object for all of them.
  department: "Cochabamba",
  dependency: "Fiscal",
  shift: "Mañana",
  educationLevel: "Educación Primaria Comunitaria Vocacional",
}

/** The text the file actually carries, read back out of the package the way Word reads it. */
async function documentXmlOf(
  ...args: Parameters<typeof pdcDocxOf>
): Promise<string> {
  const buffer = await Packer.toBuffer(pdcDocxOf(...args))
  const zip = await JSZip.loadAsync(buffer)
  const xml = await zip.file("word/document.xml")?.async("string")
  return xml ?? ""
}

describe("pdcDocxOf", () => {
  let xml: string

  beforeAll(async () => {
    xml = await documentXmlOf({
      plan: plan(),
      institution,
      adaptations: [adaptation()],
    })
  })

  // A .docx is a package, not an HTML file under another name. The old export wrote markup and
  // called it .doc, which Word opens but no other reader treats as a document.
  it("packs a real Office document", async () => {
    const buffer = await Packer.toBuffer(
      pdcDocxOf({ plan: plan(), institution, adaptations: [] })
    )
    const zip = await JSZip.loadAsync(buffer)

    expect(zip.file("word/document.xml")).not.toBeNull()
    expect(zip.file("[Content_Types].xml")).not.toBeNull()
  })

  // The template is Letter on its side. Portrait, the six columns of the weekly table do not fit.
  it("sets the page up the way the template does", () => {
    expect(xml).toContain('w:orient="landscape"')
  })

  it("heads the plan the way the form heads it", () => {
    expect(xml).toContain("EDUCACIÓN PRIMARIA COMUNITARIA VOCACIONAL")
    expect(xml).toContain("PLAN DE DESARROLLO CURRICULAR Nº 4")
  })

  it("fills the reference table with the school and the course", () => {
    expect(xml).toContain("Sacaba")
    expect(xml).toContain("6 de Junio")
    expect(xml).toContain("Luis Rojas")
    expect(xml).toContain("Ana Pérez")
    expect(xml).toContain("Primaria Comunitaria Vocacional")
    expect(xml).toContain("Segundo")
    expect(xml).toContain("03 de agosto")
    expect(xml).toContain("04 de septiembre")
  })

  // The complaint this was written for: the exported file came out without the plan in it.
  it("carries the month the teacher actually wrote", () => {
    expect(xml).toContain("Fortalecemos la práctica de valores.")
    expect(xml).toContain("Comunidad y Sociedad")
    expect(xml).toContain("Comunicación y Lenguajes")
    expect(xml).toContain("Desarrollamos la lectura comprensiva.")
    expect(xml).toContain("Semana 1")
    expect(xml).toContain("T 7 La poesía")
    expect(xml).toContain("Leemos poemas")
    expect(xml).toContain("Periódicos")
    expect(xml).toContain("Material manipulable.")
  })

  // Three, not four. The form evaluates on SER, SABER and HACER; the fourth dimension the rest of
  // the system grades on has no column here.
  it("prints the three criteria of the form and not the fourth", () => {
    expect(xml).toContain("SER:")
    expect(xml).toContain("SABER:")
    expect(xml).toContain("HACER:")
    expect(xml).not.toContain("DECIDIR:")
  })

  it("carries the significant adaptations in the form's column order", () => {
    expect(xml).toContain("ADAPTACIONES CURRICULARES SIGNIFICATIVAS")
    expect(xml).toContain("Números hasta el 20")
    expect(xml).toContain("TEA")
    expect(xml).toContain("Material concreto")
    expect(xml).toContain("Cuenta con apoyo")
  })

  it("closes with the month's product, the bibliography and the two signatures", () => {
    expect(xml).toContain("Antología de poemas")
    expect(xml).toContain("Currículo Base 2023")
    expect(xml).toContain("Firma del Maestro/a")
    expect(xml).toContain("Sello y Firma del Director/a")
  })

  // The greens are the template's own fills. Without them the sheet is a grid of text.
  it("shades the bands the way the template shades them", () => {
    expect(xml).toContain("E2EFD9")
    expect(xml).toContain("A8D08D")
  })

  // A month with no adaptation still hands in the empty row the teacher writes on by hand.
  it("keeps the blank adaptation row when none was written", async () => {
    const empty = await documentXmlOf({
      plan: plan(),
      institution,
      adaptations: [],
    })

    expect(empty).toContain("ADAPTACIONES CURRICULARES SIGNIFICATIVAS")
    expect(empty).toContain("Criterio de evaluación")
  })

  // The heading is filled in before a single subject is written, and the export is offered from
  // the first step onwards.
  it("builds a plan that has no subjects yet", async () => {
    const bare = await documentXmlOf({
      plan: plan({ subjects: [], holisticObjective: null }),
      adaptations: [],
    })

    expect(bare).toContain("PLAN DE DESARROLLO CURRICULAR Nº 4")
  })
})
