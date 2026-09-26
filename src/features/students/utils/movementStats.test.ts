import { describe, expect, it } from "vitest"

import {
  inCalendarOrder,
  monthLabel,
  movementByMonth,
  parallelsByGrade,
  runningEnrolment,
} from "./movementStats"

const month = (
  m: number,
  enrolled: number,
  withdrawn: number,
  year = 2026
) => ({
  year,
  month: m,
  enrolled,
  withdrawn,
})

describe("monthLabel", () => {
  it("nombra el mes por su número de calendario, no por su índice", () => {
    expect(monthLabel(1)).toBe("Ene")
    expect(monthLabel(12)).toBe("Dic")
  })
})

describe("inCalendarOrder", () => {
  it("ordena por año antes que por mes", () => {
    const rows = [month(2, 0, 0, 2026), month(11, 0, 0, 2025)]

    expect(inCalendarOrder(rows).map((m) => m.year)).toEqual([2025, 2026])
  })

  it("no toca el arreglo que recibe", () => {
    const rows = [month(3, 0, 0), month(2, 0, 0)]

    inCalendarOrder(rows)

    expect(rows[0]?.month).toBe(3)
  })
})

describe("runningEnrolment", () => {
  /**
   * Es una resta corrida, no la suma de las altas.
   *
   * Febrero abre con 30 y marzo suma 5 y pierde 2, así que en marzo la escuela tiene 33 y no 35.
   * Sumar sólo las altas daría el total de gente que alguna vez entró, que no es la matrícula.
   */
  it("descuenta las bajas", () => {
    const points = runningEnrolment([month(2, 30, 0), month(3, 5, 2)])

    expect(points).toEqual([
      { x: "Feb", y: 30 },
      { x: "Mar", y: 33 },
    ])
  })

  it("acumula en orden de calendario aunque lleguen al revés", () => {
    const points = runningEnrolment([month(3, 5, 2), month(2, 30, 0)])

    expect(points.at(-1)).toEqual({ x: "Mar", y: 33 })
  })

  /** Un mes de sólo bajas baja el acumulado; la matrícula puede caer. */
  it("deja caer el acumulado en un mes sin altas", () => {
    const points = runningEnrolment([month(2, 30, 0), month(3, 0, 4)])

    expect(points.at(-1)?.y).toBe(26)
  })

  it("no inventa meses que la gestión no tuvo", () => {
    expect(runningEnrolment([month(2, 30, 0)])).toHaveLength(1)
  })
})

describe("movementByMonth", () => {
  it("separa altas de bajas en orden de calendario", () => {
    expect(movementByMonth([month(3, 5, 2), month(2, 30, 1)])).toEqual([
      { name: "Feb", Altas: 30, Bajas: 1 },
      { name: "Mar", Altas: 5, Bajas: 2 },
    ])
  })
})

describe("parallelsByGrade", () => {
  it("junta los paralelos de un grado en una fila", () => {
    const courses = [
      { gradeName: "Quinto" },
      { gradeName: "Quinto" },
      { gradeName: "Sexto" },
    ]

    expect(parallelsByGrade(courses)).toEqual([
      { name: "Quinto", paralelos: 2 },
      { name: "Sexto", paralelos: 1 },
    ])
  })

  /** Cuenta cursos, no estudiantes: un paralelo con dos chicos sigue siendo un paralelo. */
  it("no se entera de cuánta gente hay adentro", () => {
    expect(parallelsByGrade([{ gradeName: "Quinto" }])).toEqual([
      { name: "Quinto", paralelos: 1 },
    ])
  })

  it("sin cursos abiertos responde vacío", () => {
    expect(parallelsByGrade([])).toEqual([])
  })
})
