import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi, beforeEach } from "vitest"

const useStudentMovementSummary = vi.hoisted(() => vi.fn())
const useAllCourses = vi.hoisted(() => vi.fn())

vi.mock("../hooks/useStudent", () => ({ useStudentMovementSummary }))
vi.mock("@/features/courses/hooks/useCourses", () => ({ useAllCourses }))

// jsdom no hace layout, así que los gráficos que se miden contra su contenedor nunca llegan a
// dibujarse. Lo que se prueba acá es qué datos pide el tablero y qué rotula, no la geometría.
vi.mock("@visx/responsive", () => ({
  ParentSize: ({
    children,
  }: {
    children: (size: { width: number; height: number }) => React.ReactNode
  }) => children({ width: 300, height: 150 }),
}))

import { SecretaryDashboardCharts } from "./SecretaryDashboardCharts"

const YEAR_ID = 7

const month = (m: number, enrolled: number, withdrawn: number) => ({
  year: 2026,
  month: m,
  enrolled,
  withdrawn,
})

const loaded = <T,>(data: T) => ({ data, isPending: false, isError: false })
const pending = { data: undefined, isPending: true, isError: false }
const failed = { data: undefined, isPending: false, isError: true }

const movement = (
  byMonth: ReturnType<typeof month>[],
  byReason: { reason: string | null; students: number }[] = []
) => loaded({ byMonth, byReason })

beforeEach(() => {
  vi.clearAllMocks()
  useStudentMovementSummary.mockReturnValue(
    movement(
      [month(2, 30, 0), month(3, 5, 2)],
      // El motivo llega como la etiqueta que la escuela guardó, no como el nombre del enum.
      [{ reason: "Transferencia", students: 2 }]
    )
  )
  useAllCourses.mockReturnValue(
    loaded({ content: [{ id: "c-1", gradeName: "Quinto", parallelName: "A" }] })
  )
})

describe("SecretaryDashboardCharts", () => {
  it("lee la gestión que recibe", () => {
    render(<SecretaryDashboardCharts academicYearId={YEAR_ID} />)

    expect(useStudentMovementSummary).toHaveBeenCalledWith(YEAR_ID)
  })

  /** Sin notas ni riesgo: Secretaría administra matrícula, no rendimiento. */
  it("no muestra ninguna tarjeta académica", () => {
    render(<SecretaryDashboardCharts academicYearId={YEAR_ID} />)

    expect(screen.queryByText(/promedio/i)).toBeNull()
    expect(screen.queryByText(/riesgo/i)).toBeNull()
  })

  it("nombra las cuatro tarjetas del rol", () => {
    render(<SecretaryDashboardCharts academicYearId={YEAR_ID} />)

    for (const title of [
      /altas y bajas por mes/i,
      /matrícula acumulada/i,
      /bajas por motivo/i,
      /paralelos por grado/i,
    ]) {
      expect(screen.getByText(title)).toBeInTheDocument()
    }
  })

  /** Una baja anterior a la V14 no tiene motivo guardado, y eso no es un motivo llamado "null". */
  it("nombra las bajas sin motivo registrado", () => {
    useStudentMovementSummary.mockReturnValue(
      movement([month(2, 10, 1)], [{ reason: null, students: 1 }])
    )

    render(<SecretaryDashboardCharts academicYearId={YEAR_ID} />)

    expect(screen.getByText(/sin motivo registrado/i)).toBeInTheDocument()
  })

  it("distingue un error de una gestión sin movimiento", () => {
    useStudentMovementSummary.mockReturnValue(failed)

    render(<SecretaryDashboardCharts academicYearId={YEAR_ID} />)

    expect(screen.getAllByText(/no se pudo/i).length).toBeGreaterThan(0)
    expect(screen.queryByText(/sin movimiento registrado/i)).toBeNull()
  })

  /**
   * Mientras carga no hay meses todavía.
   *
   * Sin una rama propia, la primera pintada afirma que la gestión no tuvo movimiento y después se
   * corrige sola. Para Secretaría eso es decir que nadie se matriculó.
   */
  it("no dice que no hubo movimiento mientras lo está pidiendo", () => {
    useStudentMovementSummary.mockReturnValue(pending)

    render(<SecretaryDashboardCharts academicYearId={YEAR_ID} />)

    expect(screen.queryByText(/sin movimiento registrado/i)).toBeNull()
    expect(screen.getAllByText(/cargando/i).length).toBeGreaterThan(0)
  })

  it("avisa cuando la gestión no tuvo ninguna baja", () => {
    useStudentMovementSummary.mockReturnValue(movement([month(2, 30, 0)], []))

    render(<SecretaryDashboardCharts academicYearId={YEAR_ID} />)

    expect(screen.getByText(/ninguna baja en la gestión/i)).toBeInTheDocument()
  })
})
