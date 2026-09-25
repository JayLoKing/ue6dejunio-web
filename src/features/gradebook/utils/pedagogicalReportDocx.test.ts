import { Packer } from "docx"
import JSZip from "jszip"
import { beforeAll, describe, expect, it } from "vitest"

import type { Institution } from "@/features/institution/types"

import { pedagogicalReportDocxOf } from "./pedagogicalReportDocx"
import type { FailingStudentRow, PedagogicalReport } from "../types"

const school: Institution = {
  district: "Sacaba",
  school: 'Unidad Educativa "6 de Junio"',
  directorName: "Luis Rojas",
  department: "Cochabamba",
  dependency: "Fiscal",
  shift: "Mañana",
  educationLevel: "Educación Primaria Comunitaria Vocacional",
}

const tally = (male: number, female: number, percentage: number | null) => ({
  male,
  female,
  total: male + female,
  percentage,
})

const failing = (over: Partial<FailingStudentRow> = {}): FailingStudentRow => ({
  number: 1,
  courseEnrollmentId: "ce-1",
  studentId: "st-1",
  fullName: "Quispe Ana",
  failedAreas: [
    { classGroupId: "cg-1", subjectName: "Matemática", mark: 45 },
    { classGroupId: "cg-2", subjectName: "Lengua", mark: 48 },
  ],
  actions: "Refuerzo los martes.",
  verificationSource: "Cuaderno de refuerzo.",
  ...over,
})

const sheet = (over: Partial<PedagogicalReport> = {}): PedagogicalReport => ({
  courseId: "c-1",
  gradeName: "Quinto",
  parallelName: "B",
  year: 2026,
  homeroomTeacherName: "Mamani Rosa",
  trimester: 1,
  exists: true,
  achievements: "Leen en voz alta.",
  difficulties: "Les cuesta la división.",
  stats: {
    effective: tally(15, 15, 100),
    passed: tally(12, 11, 78),
    failed: tally(3, 4, 22),
  },
  failingStudents: [failing()],
  updatedAt: "2026-09-14T10:00:00",
  ...over,
})

/** El texto que el archivo lleva de verdad, leído del paquete como lo lee Word. */
async function documentXmlOf(
  ...args: Parameters<typeof pedagogicalReportDocxOf>
): Promise<string> {
  const buffer = await Packer.toBuffer(pedagogicalReportDocxOf(...args))
  const zip = await JSZip.loadAsync(buffer)
  const xml = await zip.file("word/document.xml")?.async("string")
  return xml ?? ""
}

describe("pedagogicalReportDocxOf", () => {
  let xml: string

  beforeAll(async () => {
    xml = await documentXmlOf({ sheet: sheet(), school })
  })

  // Un .docx es un paquete, no un HTML con otro nombre. Word abre marcado renombrado a .doc, pero
  // ningún otro lector lo trata como documento.
  it("arma un documento de Office de verdad", async () => {
    const buffer = await Packer.toBuffer(
      pedagogicalReportDocxOf({ sheet: sheet(), school })
    )
    const zip = await JSZip.loadAsync(buffer)

    expect(zip.file("word/document.xml")).not.toBeNull()
    expect(zip.file("[Content_Types].xml")).not.toBeNull()
  })

  it("titula la hoja con el trimestre en letras", async () => {
    expect(xml).toContain("INFORME PEDAGÓGICO DEL PRIMER TRIMESTRE")

    const tercero = await documentXmlOf({
      sheet: sheet({ trimester: 3 }),
      school,
    })
    expect(tercero).toContain("INFORME PEDAGÓGICO DEL TERCER TRIMESTRE")
  })

  it("es vertical, como la hoja que entrega la escuela", () => {
    expect(xml).not.toContain('w:orient="landscape"')
  })

  it("lleva los datos referenciales de la escuela y del curso", () => {
    expect(xml).toContain("6 de Junio")
    expect(xml).toContain("Sacaba")
    expect(xml).toContain("Cochabamba")
    expect(xml).toContain("Educación Primaria Comunitaria Vocacional")
    expect(xml).toContain("Quinto")
    expect(xml).toContain("2026")
    expect(xml).toContain("Mamani Rosa")
  })

  /**
   * Un run no guarda saltos de línea: Word los almacena como elemento aparte. Sin eso, los tres
   * párrafos que el docente escribió llegan a Word como uno solo.
   */
  it("conserva los saltos de línea que el docente escribió", async () => {
    const multilinea = await documentXmlOf({
      sheet: sheet({ achievements: "Primera línea.\nSegunda línea." }),
      school,
    })

    expect(multilinea).toContain("Primera línea.")
    expect(multilinea).toContain("Segunda línea.")
    expect(multilinea).toContain("<w:br/>")
  })

  it("escribe los tres grupos de la estadística", () => {
    expect(xml).toContain("EFECTIVOS")
    expect(xml).toContain("ESTUDIANTES APROBADOS")
    expect(xml).toContain("ESTUDIANTES REPROBADOS")
    expect(xml).toContain(">30<")
    expect(xml).toContain(">23<")
    expect(xml).toContain(">100,00<")
  })

  /** Sin nómina efectiva no hay porcentaje, y un cero diría que nadie aprobó. */
  it("deja el porcentaje en raya cuando no hay con qué calcularlo", async () => {
    const vacio = await documentXmlOf({
      sheet: sheet({
        stats: {
          effective: tally(0, 0, null),
          passed: tally(0, 0, null),
          failed: tally(0, 0, null),
        },
      }),
      school,
    })

    expect(vacio).toContain("—")
  })

  it("escribe el cuadro de reprobados con lo que el docente anotó", () => {
    expect(xml).toContain("Matemática")
    expect(xml).toContain("Lengua")
    expect(xml).toContain(">45<")
    expect(xml).toContain(">48<")
    expect(xml).toContain("Refuerzo los martes.")
    expect(xml).toContain("Cuaderno de refuerzo.")
  })

  /**
   * 51 es el umbral de aprobación. Redondear a entero convierte un 50,6 reprobado en un 51 que se
   * lee aprobado, dentro del cuadro de los reprobados.
   */
  it("no redondea una nota reprobada hasta el umbral de aprobación", async () => {
    const limite = await documentXmlOf({
      sheet: sheet({
        failingStudents: [
          {
            ...failing(),
            failedAreas: [
              { classGroupId: "cg-1", subjectName: "Matemática", mark: 50.6 },
            ],
          },
        ],
      }),
      school,
    })

    expect(limite).toContain(">50,6<")
    expect(limite).not.toContain(">51<")
  })

  /** El curso sin reprobados entrega el cuadro igual, con su fila en blanco. */
  it("entrega el cuadro en blanco cuando nadie reprobó", async () => {
    const sinReprobados = await documentXmlOf({
      sheet: sheet({ failingStudents: [] }),
      school,
    })

    expect(sinReprobados).toContain("APELLIDOS Y NOMBRES")
    expect(sinReprobados).not.toContain("Ningún estudiante")
  })

  it("cierra con la firma del docente de aula", () => {
    expect(xml).toContain("Atentamente")
    expect(xml).toContain("Docente de aula")
  })

  /** Sin docente de aula la línea se firma igual; lo que no puede es llevar un nombre inventado. */
  it("firma sin nombre cuando el curso no tiene docente de aula", async () => {
    const sinDocente = await documentXmlOf({
      sheet: sheet({ homeroomTeacherName: null }),
      school,
    })

    expect(sinDocente).toContain("Docente de aula")
    expect(sinDocente).not.toContain("Mamani Rosa")
  })
})
