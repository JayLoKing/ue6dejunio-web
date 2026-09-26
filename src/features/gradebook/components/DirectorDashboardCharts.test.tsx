import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi, beforeEach } from "vitest"

const useCourseSummary = vi.hoisted(() => vi.fn())
const useRiskCourseSummary = vi.hoisted(() => vi.fn())

vi.mock("../hooks/useGradebook", () => ({ useCourseSummary }))
vi.mock("@/features/risk/hooks/useRisk", () => ({ useRiskCourseSummary }))

// jsdom no hace layout, así que los gráficos que se miden contra su contenedor nunca llegan a
// dibujarse. Lo que se prueba acá es qué datos pide el tablero y qué rotula, no la geometría.
vi.mock("@visx/responsive", () => ({
  ParentSize: ({
    children,
  }: {
    children: (size: { width: number; height: number }) => React.ReactNode
  }) => children({ width: 300, height: 150 }),
}))

import { DirectorDashboardCharts } from "./DirectorDashboardCharts"

const YEAR_ID = 7

const academic = (
  parallelName: string,
  students: number,
  passed: number,
  failed: number,
  average: number | null,
  gradeName = "Quinto"
) => ({
  courseId: crypto.randomUUID(),
  gradeName,
  parallelName,
  students,
  passed,
  failed,
  average,
})

const risk = (parallelName: string) => ({
  courseId: crypto.randomUUID(),
  gradeName: "Quinto",
  parallelName,
  critical: 2,
  atRisk: 3,
  safe: 10,
  outstanding: 4,
  unpredicted: 1,
})

const loaded = <T,>(data: T) => ({
  data,
  isPending: false,
  isError: false,
})

const pending = { data: undefined, isPending: true, isError: false }
const failed = { data: undefined, isPending: false, isError: true }

beforeEach(() => {
  vi.clearAllMocks()
  useCourseSummary.mockReturnValue(loaded([academic("A", 20, 15, 5, 68.5)]))
  useRiskCourseSummary.mockReturnValue(loaded([risk("A")]))
})

describe("DirectorDashboardCharts", () => {
  it("lee la gestión que recibe, no una fija", () => {
    render(<DirectorDashboardCharts academicYearId={YEAR_ID} />)

    expect(useCourseSummary).toHaveBeenCalledWith(YEAR_ID, expect.any(Number))
    expect(useRiskCourseSummary).toHaveBeenCalledWith(
      YEAR_ID,
      expect.any(Number)
    )
  })

  /**
   * El trimestre elegido tiene que llegar a las dos consultas.
   *
   * El tablero del docente arrancó con un 1 escrito en la llamada y no sólo en el título: en junio
   * mostraba las notas de marzo. Este no repite eso.
   */
  it("cambia de trimestre y vuelve a pedir los dos resúmenes", async () => {
    render(<DirectorDashboardCharts academicYearId={YEAR_ID} />)

    await userEvent.click(screen.getByRole("tab", { name: /2do trimestre/i }))

    expect(useCourseSummary).toHaveBeenCalledWith(YEAR_ID, 2)
    expect(useRiskCourseSummary).toHaveBeenCalledWith(YEAR_ID, 2)
  })

  /** Los tres trimestres a la vez para la evolución, sin depender del elegido arriba. */
  it("pide los tres trimestres para la evolución institucional", () => {
    render(<DirectorDashboardCharts academicYearId={YEAR_ID} />)

    for (const t of [1, 2, 3]) {
      expect(useCourseSummary).toHaveBeenCalledWith(YEAR_ID, t)
    }
  })

  /**
   * Una lista vacía y una consulta rota se ven igual si nadie las separa, y la segunda diría
   * "ningún curso tiene problemas" cuando lo cierto es que no se pudo preguntar.
   */
  it("distingue un error de una escuela sin datos", () => {
    useCourseSummary.mockReturnValue(failed)

    render(<DirectorDashboardCharts academicYearId={YEAR_ID} />)

    expect(screen.getAllByText(/no se pudo/i).length).toBeGreaterThan(0)
    expect(screen.queryByText(/ningún curso tiene notas/i)).toBeNull()
  })

  /**
   * Mientras carga, el arreglo también está vacío.
   *
   * Sin una rama propia, la primera pintada afirma que la escuela no tiene notas y después se
   * corrige sola. Quien mire medio segundo se lleva la respuesta equivocada.
   */
  it("no dice que no hay datos mientras los está pidiendo", () => {
    useCourseSummary.mockReturnValue(pending)
    useRiskCourseSummary.mockReturnValue(pending)

    render(<DirectorDashboardCharts academicYearId={YEAR_ID} />)

    expect(screen.queryByText(/ningún curso tiene notas/i)).toBeNull()
    expect(screen.queryByText(/sin cursos en la gestión/i)).toBeNull()
    expect(screen.getAllByText(/cargando/i).length).toBeGreaterThan(0)
  })

  it("avisa cuando la gestión no tiene ningún curso", () => {
    useCourseSummary.mockReturnValue(loaded([]))
    useRiskCourseSummary.mockReturnValue(loaded([]))

    render(<DirectorDashboardCharts academicYearId={YEAR_ID} />)

    expect(
      screen.getByText(/ningún curso tiene notas en este trimestre/i)
    ).toBeInTheDocument()
    expect(screen.getAllByText(/sin cursos en la gestión/i).length).toBe(3)
  })

  it("titula cada tarjeta con el trimestre que se está mirando", async () => {
    render(<DirectorDashboardCharts academicYearId={YEAR_ID} />)

    await userEvent.click(screen.getByRole("tab", { name: /3er trimestre/i }))

    expect(
      screen.getByText(/promedio por curso \(3er trimestre\)/i)
    ).toBeInTheDocument()
  })
})
