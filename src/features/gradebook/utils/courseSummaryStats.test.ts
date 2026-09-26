import { describe, expect, it } from "vitest"

import type { CourseAcademicSummary } from "../types"
import {
  averagesByCourse,
  courseLabel,
  enrolmentByGrade,
  weightedAverage,
} from "./courseSummaryStats"

const course = (
  gradeName: string,
  parallelName: string,
  students: number,
  average: number | null
): CourseAcademicSummary => ({
  courseId: crypto.randomUUID(),
  gradeName,
  parallelName,
  students,
  passed: 0,
  failed: 0,
  average,
})

describe("courseLabel", () => {
  it("junta grado y paralelo como los nombra la escuela", () => {
    expect(courseLabel({ gradeName: "Quinto", parallelName: "B" })).toBe(
      "Quinto B"
    )
  })
})

describe("averagesByCourse", () => {
  it("deja afuera el curso que nadie calificó", () => {
    const rows = [
      course("Quinto", "A", 20, null),
      course("Quinto", "B", 18, 70),
    ]

    expect(averagesByCourse(rows)).toEqual([{ name: "Quinto B", promedio: 70 }])
  })

  /** Sin nota no es cero. Un cero lo dibujaría como el peor curso de la escuela. */
  it("no convierte la ausencia de nota en un cero", () => {
    expect(averagesByCourse([course("Quinto", "A", 20, null)])).toEqual([])
  })
})

describe("weightedAverage", () => {
  /**
   * Ponderado por matrícula, no promedio de promedios.
   *
   * 30 estudiantes con 80 y 10 con 40 dan 70, no 60. Promediar los promedios haría que el paralelo
   * chico pese lo mismo que el grande, y la escuela no tiene cursos del mismo tamaño.
   */
  it("pesa cada curso por su matrícula", () => {
    const rows = [course("Quinto", "A", 30, 80), course("Quinto", "B", 10, 40)]

    expect(weightedAverage(rows)).toBe(70)
  })

  it("ignora el curso sin nota en el numerador y en el denominador", () => {
    const rows = [
      course("Quinto", "A", 30, 80),
      course("Quinto", "B", 10, null),
    ]

    // Si el curso sin nota entrara al denominador, daría 60.
    expect(weightedAverage(rows)).toBe(80)
  })

  it("responde null cuando nadie calificó, no cero", () => {
    expect(weightedAverage([course("Quinto", "A", 30, null)])).toBeNull()
  })

  it("responde null sin cursos", () => {
    expect(weightedAverage([])).toBeNull()
  })
})

describe("enrolmentByGrade", () => {
  it("suma los paralelos de un mismo grado en una sola fila", () => {
    const rows = [
      course("Quinto", "A", 20, 68),
      course("Quinto", "B", 18, 70),
      course("Sexto", "A", 25, 72),
    ]

    expect(enrolmentByGrade(rows)).toEqual([
      { name: "Quinto", estudiantes: 38 },
      { name: "Sexto", estudiantes: 25 },
    ])
  })

  /** Un curso sin calificar sigue teniendo estudiantes: la matrícula no depende de la nota. */
  it("cuenta la matrícula del curso sin nota", () => {
    expect(enrolmentByGrade([course("Quinto", "A", 20, null)])).toEqual([
      { name: "Quinto", estudiantes: 20 },
    ])
  })
})
