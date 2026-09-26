import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi, beforeEach } from "vitest"

const useCentralizer = vi.hoisted(() => vi.fn())
const useCourseAttendanceStats = vi.hoisted(() => vi.fn())
const useCourseRisk = vi.hoisted(() => vi.fn())

vi.mock("../hooks/useGradebook", () => ({
  useCentralizer,
  useCourseAttendanceStats,
}))
vi.mock("@/features/risk/hooks/useRisk", () => ({ useCourseRisk }))

// jsdom no hace layout, así que los gráficos que se miden contra su contenedor nunca llegan a
// dibujarse. Lo que se prueba acá es qué datos pide el tablero y qué rotula, no la geometría.
vi.mock("@visx/responsive", () => ({
  ParentSize: ({
    children,
  }: {
    children: (size: { width: number; height: number }) => React.ReactNode
  }) => children({ width: 300, height: 150 }),
}))

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
    useCourseAttendanceStats.mockReturnValue({ data: undefined })
    useCourseRisk.mockReturnValue({ data: [] })
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

  /**
   * Se comprueba contra el riesgo y no contra el centralizador, aunque el centralizador sea el que
   * alimenta la mayoría de las tarjetas: los tres trimestres se piden siempre, para la evolución,
   * así que una llamada con `2` existe desde el primer render y afirmarla pasaría sin haber tocado
   * nada. El riesgo sí se pide sólo con el trimestre elegido.
   */
  it("al elegir otro trimestre vuelve a pedir los datos de ese trimestre", async () => {
    render(<DashboardCharts courseId="c-1" />)

    await userEvent.click(screen.getByRole("tab", { name: /2do/i }))

    expect(useCourseRisk).toHaveBeenLastCalledWith("c-1", 2)
  })

  /** La evolución necesita los tres, esté cual esté elegido: la pregunta es si el curso mejora. */
  it("pide los tres trimestres para la curva de evolución", () => {
    render(<DashboardCharts courseId="c-1" />)

    for (const t of [1, 2, 3]) {
      expect(useCentralizer).toHaveBeenCalledWith(
        "c-1",
        t,
        expect.objectContaining({ limit: 200 })
      )
    }
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
    expect(screen.getByText(/Aprobados y reprobados/)).toHaveTextContent(
      "3er trimestre"
    )
  })
})
