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

// Las barras reales sólo dibujan rectángulos sin nombre. Este doble deja en el DOM qué serie pidió
// el tablero y con qué color; se llama `Bar` porque el gráfico reconoce sus series por ese nombre.
vi.mock("@/components/charts/bar", () => ({
  Bar: function Bar({ dataKey, fill }: { dataKey: string; fill?: string }) {
    return <g data-fill={fill} data-series={dataKey} />
  },
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

  /**
   * Los atrasos iban sumados a las licencias, así que el docente no podía ver cuántos hubo. Ahora
   * que se registran por separado, el gráfico los muestra en su propia serie.
   */
  it("muestra los atrasos por mes como una serie propia", () => {
    const month = {
      year: 2026,
      month: 3,
      present: 20,
      absent: 2,
      late: 3,
      excused: 1,
      computableSessions: 25,
      percentage: 80,
    }
    useCourseAttendanceStats.mockReturnValue({
      data: {
        courseId: "c-1",
        scope: "course",
        trimester: null,
        overall: month,
        byMonth: [month],
        byTrimester: [],
      },
    })

    const { container } = render(<DashboardCharts courseId="c-1" />)

    const series = (key: string) =>
      container.querySelector(`[data-series="${key}"]`)
    expect(series("Atrasos")).not.toBeNull()
    expect(series("Licencias")).not.toBeNull()
    expect(series("Atrasos")?.getAttribute("data-fill")).not.toBe(
      series("Licencias")?.getAttribute("data-fill")
    )
  })
})
