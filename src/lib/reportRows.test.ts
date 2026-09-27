import { describe, expect, it } from "vitest"

import {
  attendanceReportRows,
  honorRollRows,
  riskReportRows,
} from "./reportRows"
import type {
  HonorRollEntry,
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
