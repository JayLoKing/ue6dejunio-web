import { describe, expect, it } from "vitest"

import { homeroomCourses, takenParallels } from "./courseAvailability"
import type { Course } from "../types/course"

const course = (over: Partial<Course>): Course => ({
  id: "c-1",
  gradeId: 1,
  gradeName: "Primero",
  parallelId: 1,
  parallelName: "A",
  academicYearId: 2,
  year: 2026,
  homeroomTeacherId: null,
  homeroomTeacherName: null,
  active: true,
  homeroomTeacherActive: false,
  ...over,
})

describe("takenParallels", () => {
  it("devuelve el curso que ya ocupa cada paralelo del grado", () => {
    const primeroA = course({ id: "c-1", parallelId: 1, parallelName: "A" })
    const primeroB = course({ id: "c-2", parallelId: 2, parallelName: "B" })

    const taken = takenParallels([primeroA, primeroB], 2, 1)

    expect(taken.get(1)).toBe(primeroA)
    expect(taken.get(2)).toBe(primeroB)
  })

  it("ignora los cursos de otro grado", () => {
    const segundoA = course({ id: "c-9", gradeId: 2, gradeName: "Segundo" })

    expect(takenParallels([segundoA], 2, 1).size).toBe(0)
  })

  /**
   * El paralelo ocupado en 2025 está libre en 2026: un curso es de una gestión. Sin este corte, el
   * segundo año de uso deshabilitaría todos los paralelos que la escuela usó alguna vez.
   */
  it("ignora los cursos de otra gestión", () => {
    const primeroADe2025 = course({ academicYearId: 1, year: 2025 })

    expect(takenParallels([primeroADe2025], 2, 1).size).toBe(0)
  })

  it("no reclama nada sin grado elegido ni sin gestión conocida", () => {
    const primeroA = course({})

    expect(takenParallels([primeroA], 2, undefined).size).toBe(0)
    expect(takenParallels([primeroA], null, 1).size).toBe(0)
  })
})

describe("homeroomCourses", () => {
  it("devuelve el curso del que cada docente ya es encargado", () => {
    const primeroA = course({ id: "c-1", homeroomTeacherId: "t-1" })
    const segundoB = course({
      id: "c-2",
      gradeId: 2,
      gradeName: "Segundo",
      parallelId: 2,
      parallelName: "B",
      homeroomTeacherId: "t-2",
    })

    const byTeacher = homeroomCourses([primeroA, segundoB], 2)

    expect(byTeacher.get("t-1")).toBe(primeroA)
    expect(byTeacher.get("t-2")).toBe(segundoB)
  })

  it("ignora los cursos sin encargado", () => {
    expect(homeroomCourses([course({ homeroomTeacherId: null })], 2).size).toBe(
      0
    )
  })

  /** Haber sido encargado en 2025 no ocupa a nadie en 2026. */
  it("ignora los cursos de otra gestión", () => {
    const viejo = course({
      academicYearId: 1,
      year: 2025,
      homeroomTeacherId: "t-1",
    })

    expect(homeroomCourses([viejo], 2).size).toBe(0)
  })

  it("no reclama nada sin gestión conocida", () => {
    const primeroA = course({ homeroomTeacherId: "t-1" })

    expect(homeroomCourses([primeroA], null).size).toBe(0)
  })
})
