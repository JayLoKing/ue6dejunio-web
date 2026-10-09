import { Packer } from "docx"
import JSZip from "jszip"
import { describe, expect, it } from "vitest"

import { tabularReportDocxOf } from "@/lib/tabularReportDocx"
import type { Institution } from "@/features/institution/types"

import {
  attendanceReportRows,
  centralizerColumns,
  centralizerRows,
  honorRollRows,
  riskReportRows,
} from "./reportRows"
import type {
  HonorRollEntry,
  StudentAnnualSummary,
  StudentAttendanceRow,
} from "@/features/gradebook/types"
import type { InstitutionRiskEntry } from "@/features/risk/types/risk"

const entry = (over: Partial<HonorRollEntry>): HonorRollEntry => ({
  position: 1,
  courseEnrollmentId: "ce-1",
  studentId: "st-1",
  fullName: "Ana Aguilar",
  courseId: "c-1",
  gradeName: "Primero",
  parallelName: "A",
  finalAverage: 92.4,
  ...over,
})

describe("honorRollRows", () => {
  it("arma posición, nombre, curso y promedio", () => {
    const rows = honorRollRows([entry({})], { withCourse: true })

    expect(rows[0]).toEqual(["1", "Ana Aguilar", "Primero A", "92.4"])
  })

  /**
   * El podio de un solo curso no repite el aula treinta veces: todas sus filas vienen del mismo
   * curso y el encabezado del documento ya lo dice.
   */
  it("omite la columna de curso cuando el podio es de un curso", () => {
    const rows = honorRollRows([entry({})], { withCourse: false })

    expect(rows[0]).toEqual(["1", "Ana Aguilar", "92.4"])
  })

  it("mantiene el orden que vino de la API, que ya es el del podio", () => {
    const rows = honorRollRows(
      [
        entry({ position: 1, fullName: "Ana Aguilar" }),
        entry({ position: 2, fullName: "Luis Zambrana" }),
      ],
      { withCourse: false }
    )

    expect(rows.map((r) => r[1])).toEqual(["Ana Aguilar", "Luis Zambrana"])
  })
})

const risk = (over: Partial<InstitutionRiskEntry>): InstitutionRiskEntry => ({
  position: 1,
  predictionId: "p-1",
  studentId: "st-1",
  fullName: "Ana Aguilar",
  courseId: "c-1",
  gradeName: "Primero",
  parallelName: "A",
  classGroupId: "cg-1",
  subjectName: "Matematicas",
  riskLevel: "RiesgoCritico",
  pFail: 0.8123,
  attended: false,
  ...over,
})

describe("riskReportRows", () => {
  /** RF 36: nombre, grado y paralelo, la materia de mayor riesgo, la categoría y la probabilidad. */
  it("arma las cinco columnas que pide el RF", () => {
    const rows = riskReportRows([risk({})])

    expect(rows[0]).toEqual([
      "Ana Aguilar",
      "Primero A",
      "Matematicas",
      "Riesgo crítico",
      "81.2%",
    ])
  })

  /**
   * La categoría va traducida con `riskLevelLabel`, el mismo mapa que usan las tablas en pantalla.
   * Una que este build no conoce sale tal cual: el nombre crudo sirve poco, pero es verdad y dice
   * que el web quedó atrás del modelo.
   */
  it("deja pasar verbatim una categoría que no conoce", () => {
    const rows = riskReportRows([risk({ riskLevel: "CategoriaNueva" })])

    expect(rows[0][3]).toBe("CategoriaNueva")
  })
})

const attendance = (
  over: Partial<StudentAttendanceRow>
): StudentAttendanceRow => ({
  courseEnrollmentId: "ce-1",
  studentId: "st-1",
  studentName: "Ana Aguilar",
  present: 30,
  absent: 4,
  late: 2,
  excused: 1,
  computableSessions: 36,
  percentage: 83.3,
  ...over,
})

describe("attendanceReportRows", () => {
  /** RF 37: el porcentaje y los totales de presentes, ausentes, con licencia y con atraso. */
  it("arma la numeración y los totales que pide el RF", () => {
    const rows = attendanceReportRows([attendance({})])

    expect(rows[0]).toEqual(["1", "Ana Aguilar", "30", "4", "1", "2", "83.3%"])
  })

  it("numera las filas en el orden en que llegan", () => {
    const rows = attendanceReportRows([
      attendance({ studentName: "Ana Aguilar" }),
      attendance({ studentName: "Luis Zambrana" }),
    ])

    expect(rows.map((r) => r[0])).toEqual(["1", "2"])
  })

  /**
   * Nadie lo marcó, así que no hay porcentaje. Un 0% diría que faltó a todo, que es exactamente lo
   * que no se sabe.
   */
  it("escribe una raya cuando el estudiante no tiene día computable", () => {
    const rows = attendanceReportRows([
      attendance({
        present: 0,
        absent: 0,
        late: 0,
        excused: 0,
        computableSessions: 0,
        percentage: null,
      }),
    ])

    expect(rows[0][6]).toBe("—")
  })
})

const summary = (
  over: Partial<StudentAnnualSummary> = {}
): StudentAnnualSummary => ({
  courseEnrollmentId: "ce-1",
  studentId: "st-1",
  fullName: "Ana Aguilar",
  subjects: [
    {
      classGroupId: "cg-1",
      subjectName: "Matematica",
      trimester1: 80,
      trimester2: 85,
      trimester3: 90,
      average: 85,
    },
    {
      classGroupId: "cg-2",
      subjectName: "Lenguaje",
      trimester1: 70,
      trimester2: null,
      trimester3: 75,
      average: 72.5,
    },
  ],
  trimesterAverages: [75, 85, 82.5],
  finalAverage: 80.8,
  finalResult: null,
  frozen: false,
  ...over,
})

describe("centralizerColumns", () => {
  /** Una columna por área del curso, más las fijas que el RF nombra. */
  it("arma una columna por área del curso", () => {
    const headers = centralizerColumns([summary()]).map((c) => c.header)

    expect(headers).toEqual([
      "N°",
      "Estudiante",
      "Matematica",
      "Lenguaje",
      "1er trim.",
      "2do trim.",
      "3er trim.",
      "Promedio final",
      "Estado",
    ])
  })

  /** Sin estudiantes no hay de dónde leer las áreas; quedan las fijas y el documento sale igual. */
  it("devuelve sólo las columnas fijas sin estudiantes", () => {
    const headers = centralizerColumns([]).map((c) => c.header)

    expect(headers).toEqual([
      "N°",
      "Estudiante",
      "1er trim.",
      "2do trim.",
      "3er trim.",
      "Promedio final",
      "Estado",
    ])
  })
})

describe("centralizerRows", () => {
  it("arma las notas por área, los trimestres, el final y el estado", () => {
    const rows = centralizerRows([summary()])

    expect(rows[0]).toEqual([
      "1",
      "Ana Aguilar",
      "85.0",
      "72.5",
      "75.0",
      "85.0",
      "82.5",
      "80.8",
      "APROBADO",
    ])
  })

  /**
   * Sin promedio final no se dice "REPROBADO": `statusOf` decide sobre un número, y no haberlo
   * calificado no es haberlo reprobado.
   */
  it("distingue sin calificar de reprobado", () => {
    const rows = centralizerRows([summary({ finalAverage: null })])

    expect(rows[0][8]).toBe("Sin calificar")
  })

  it("marca reprobado bajo el umbral", () => {
    const rows = centralizerRows([summary({ finalAverage: 40 })])

    expect(rows[0][8]).toBe("REPROBADO")
  })

  /**
   * Las celdas tienen que caer bajo su encabezado. Si una fila trae las áreas en otro orden que la
   * primera, se busca por nombre y no por posición.
   */
  it("ubica cada área por nombre y no por posición", () => {
    const first = summary()
    const second = summary({
      fullName: "Luis Zambrana",
      subjects: [first.subjects[1], first.subjects[0]],
    })

    const rows = centralizerRows([first, second])

    expect(rows[1][2]).toBe("85.0")
    expect(rows[1][3]).toBe("72.5")
  })
})

/**
 * El consolidado de un docente técnico trae sólo sus áreas, y la API deja en null los promedios por
 * trimestre, el final y el resultado: son de todas las materias, y él no las lee. El documento no
 * puede imprimir esas columnas vacías, porque una raya bajo "Estado" diría "sin calificar".
 */
describe("centralizer of one subject", () => {
  const scoped = summary({
    subjects: [summary().subjects[0]],
    trimesterAverages: [null, null, null],
    finalAverage: null,
    finalResult: null,
  })

  it("lleva sólo el estudiante y sus áreas", () => {
    const headers = centralizerColumns([scoped], { subjectOnly: true }).map(
      (c) => c.header
    )

    expect(headers).toEqual(["N°", "Estudiante", "Matematica"])
  })

  it("arma las filas con las mismas columnas", () => {
    const rows = centralizerRows([scoped], { subjectOnly: true })

    expect(rows[0]).toEqual(["1", "Ana Aguilar", "85.0"])
  })
})

describe("centralizerRows of a closed year", () => {
  const approved = summary({ finalResult: "APPROVED", frozen: true })
  const failed = summary({
    fullName: "Luis Zambrana",
    finalAverage: 40,
    finalResult: "FAILED",
    frozen: true,
  })
  const withdrawn = summary({
    fullName: "Eva Retirada",
    finalAverage: null,
    finalResult: null,
    frozen: true,
  })

  it("adds no column: the situation is the single place for the result", () => {
    const headers = centralizerColumns([approved]).map((c) => c.header)

    expect(headers).not.toContain("Resultado")
    expect(headers.slice(-2)).toEqual(["Promedio final", "Estado"])
  })

  it("writes the frozen result in Estado and Sin calificar when there is none", () => {
    const rows = centralizerRows([approved, failed, withdrawn])

    expect(rows.map((r) => r[8])).toEqual([
      "APROBADO",
      "REPROBADO",
      "Sin calificar",
    ])
    expect(rows.every((r) => r.length === 9)).toBe(true)
  })

  it("lets the frozen result override the computed average", () => {
    const row = centralizerRows([
      summary({ finalAverage: 60, finalResult: "FAILED", frozen: true }),
    ])[0]

    expect(row[8]).toBe("REPROBADO")
  })

  it("follows the annual rule in an open year", () => {
    const states = [50.49, 50.5, 50.6].map(
      (finalAverage) => centralizerRows([summary({ finalAverage })])[0][8]
    )

    expect(states).toEqual(["REPROBADO", "APROBADO", "APROBADO"])
  })

  // The builder-level checks above stay green on an empty file; the zip is what Word opens.
  it("lands in the exported .docx", async () => {
    const school: Institution = {
      district: "D",
      school: "Unidad Educativa 6 de Junio",
      directorName: "Director",
      department: "Cochabamba",
      dependency: "Fiscal",
      shift: "Mañana",
      educationLevel: "Primaria",
    }
    const exportOf = async (data: StudentAnnualSummary[]): Promise<string> => {
      const doc = tabularReportDocxOf({
        school,
        title: "CONSOLIDADO DE CALIFICACIONES",
        subtitles: [],
        columns: centralizerColumns(data),
        rows: centralizerRows(data),
      })
      const zip = await JSZip.loadAsync(await Packer.toBlob(doc))
      return (await zip.file("word/document.xml")?.async("string")) ?? ""
    }

    const frozenXml = await exportOf([approved, failed])
    expect(frozenXml).not.toContain("Resultado")
    expect(frozenXml).toContain("APROBADO")
    expect(frozenXml).toContain("REPROBADO")

    const openXml = await exportOf([
      summary({ finalAverage: 50.6 }),
      summary({ fullName: "Luis Zambrana", finalAverage: 50.49 }),
    ])
    expect(openXml).not.toContain("Resultado")
    expect(openXml).toContain("APROBADO")
    expect(openXml).toContain("REPROBADO")
  })
})
