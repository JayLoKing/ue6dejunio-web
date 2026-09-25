import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi, beforeEach } from "vitest"

const useCentralizer = vi.hoisted(() => vi.fn())

vi.mock("../hooks/useGradebook", () => ({ useCentralizer }))

import { DashboardCharts } from "./DashboardCharts"

const row = (average: string) => ({
  studentId: crypto.randomUUID(),
  fullName: "Quispe Ana",
  generalAverage: average,
  subjects: [
    {
      classGroupId: "cg-1",
      subjectName: "Artes Plásticas y Visuales",
      total: average,
      graded: true,
    },
  ],
})

const page = { content: [row("80"), row("40")] }

describe("DashboardCharts", () => {
  beforeEach(() => {
    useCentralizer.mockReturnValue({ data: page })
  })

  /**
   * El tablero abría siempre en el primer trimestre y no había forma de ver otro: el 1 estaba
   * escrito en la llamada, no sólo en el título. En junio el docente miraba las notas de marzo
   * creyendo que eran las de ahora.
   */
  it("abre en el primer trimestre", () => {
    render(<DashboardCharts courseId="c-1" />)

    expect(useCentralizer).toHaveBeenCalledWith(
      "c-1",
      1,
      expect.objectContaining({ limit: 200 })
    )
  })

  it("al elegir otro trimestre vuelve a pedir los datos de ese trimestre", async () => {
    render(<DashboardCharts courseId="c-1" />)

    await userEvent.click(screen.getByRole("tab", { name: /2do/i }))

    expect(useCentralizer).toHaveBeenLastCalledWith(
      "c-1",
      2,
      expect.objectContaining({ limit: 200 })
    )
  })

  /** Y los títulos dicen cuál se está mirando, porque son la única pista en pantalla. */
  it("los títulos nombran el trimestre elegido", async () => {
    render(<DashboardCharts courseId="c-1" />)

    expect(screen.getByText(/Promedio por materia/)).toHaveTextContent(
      "1er trimestre"
    )

    await userEvent.click(screen.getByRole("tab", { name: /3er/i }))

    expect(screen.getByText(/Promedio por materia/)).toHaveTextContent(
      "3er trimestre"
    )
    expect(screen.getByText(/Aprobados vs reprobados/)).toHaveTextContent(
      "3er trimestre"
    )
  })
})
