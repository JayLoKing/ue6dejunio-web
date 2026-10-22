import { Children, isValidElement, type ReactNode } from "react"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

const useCentralizers = vi.hoisted(() => vi.fn())
const useAnnualCentralizers = vi.hoisted(() => vi.fn())
const useClassGroupsAttendanceByStudent = vi.hoisted(() => vi.fn())
const useClassGroupsRisk = vi.hoisted(() => vi.fn())

vi.mock("../hooks/useGradebook", () => ({
  useCentralizers,
  useAnnualCentralizers,
  useClassGroupsAttendanceByStudent,
}))
vi.mock("@/features/risk/hooks/useRisk", () => ({ useClassGroupsRisk }))

// jsdom no hace layout; lo que se prueba acá es qué datos dibuja cada tarjeta, no la geometría.
vi.mock("@visx/responsive", () => ({
  ParentSize: ({
    children,
  }: {
    children: (size: { width: number; height: number }) => ReactNode
  }) => children({ width: 300, height: 150 }),
}))

// Las barras reales sólo dibujan rectángulos sin nombre. Este doble deja en el DOM la serie pedida.
vi.mock("@/components/charts/bar", () => ({
  Bar: function Bar({ dataKey, fill }: { dataKey: string; fill?: string }) {
    return <g data-fill={fill} data-series={dataKey} />
  },
}))

// El doble del gráfico expone las filas que recibió y sólo conserva sus series como hijos: el eje,
// la grilla y el tooltip necesitan el contexto del gráfico real.
vi.mock("@/components/charts/bar-chart", () => ({
  BarChart: ({
    data,
    children,
  }: {
    data: Record<string, unknown>[]
    children: ReactNode
  }) => (
    <svg data-chart={JSON.stringify(data)}>
      {Children.toArray(children).filter(
        (c) =>
          isValidElement(c) &&
          typeof c.type === "function" &&
          c.type.name === "Bar"
      )}
    </svg>
  ),
}))

import type { ClassGroupItem } from "@/features/courses/types/course"

import { TechnicalDashboardCharts } from "./TechnicalDashboardCharts"

const group = (
  id: string,
  courseId: string,
  gradeName: string,
  parallelName: string
): ClassGroupItem => ({
  id,
  courseId,
  gradeName,
  parallelName,
  subjectId: "s-comp",
  subjectName: "Computación",
  teacherId: "t-1",
  teacherName: "Mamani Luis",
  active: true,
})

const groups = [
  group("cg-1", "c-1", "Quinto", "A"),
  group("cg-2", "c-2", "Sexto", "B"),
]

/** Una fila del centralizador donde su materia está junto a otra que no dicta. */
const row = (classGroupId: string, mine: number, other: number) => ({
  studentId: crypto.randomUUID(),
  fullName: "Quispe Ana",
  generalAverage: null,
  subjects: [
    {
      classGroupId,
      subjectName: "Computación",
      total: mine,
      graded: true,
    },
    {
      classGroupId: "cg-other",
      subjectName: "Matemática",
      total: other,
      graded: true,
    },
  ],
})

const centralizers = {
  isPending: false,
  isError: false,
  data: [
    { content: [row("cg-1", 80, 10), row("cg-1", 60, 10)] },
    { content: [row("cg-2", 40, 100)] },
  ],
}

const attendanceRow = {
  present: 10,
  absent: 2,
  late: 3,
  excused: 1,
}

const attendance = {
  isPending: false,
  isError: false,
  data: [
    { students: { content: [attendanceRow, attendanceRow] } },
    { students: { content: [attendanceRow] } },
  ],
}

const chartRows = (container: HTMLElement, series: string) => {
  const bar = container.querySelector(`[data-series="${series}"]`)
  const chart = bar?.closest("[data-chart]")
  return JSON.parse(chart?.getAttribute("data-chart") ?? "null") as Record<
    string,
    unknown
  >[]
}

describe("TechnicalDashboardCharts", () => {
  beforeEach(() => {
    useCentralizers.mockReturnValue(centralizers)
    useAnnualCentralizers.mockReturnValue({
      isPending: false,
      isError: false,
      data: [],
    })
    useClassGroupsAttendanceByStudent.mockReturnValue(attendance)
    useClassGroupsRisk.mockReturnValue({
      isPending: false,
      isError: false,
      data: [
        [{ riskLevel: "EnRiesgo" }, { riskLevel: "RiesgoCritico" }],
        [{ riskLevel: "SinRiesgo" }],
      ],
    })
  })

  it("explica cada tarjeta en una línea", () => {
    const { container } = render(
      <TechnicalDashboardCharts classGroups={groups} isLoading={false} />
    )

    expect(
      container.querySelectorAll("[data-slot=card-description]")
    ).toHaveLength(6)
    for (const hint of [
      /la nota media de tu materia en cada curso/i,
      /cuántos de tus estudiantes aprueban/i,
      /todos tus estudiantes por tramo de nota/i,
      /si cada curso mejora o empeora/i,
      /el atraso cuenta como asistencia/i,
      /una predicción por estudiante/i,
    ]) {
      expect(screen.getByText(hint)).toBeInTheDocument()
    }
  })

  it("nombra la materia en el encabezado", () => {
    render(<TechnicalDashboardCharts classGroups={groups} isLoading={false} />)

    expect(screen.getByText(/Computación/)).toBeInTheDocument()
  })

  it("pide el centralizador de cada curso para el trimestre elegido", async () => {
    render(<TechnicalDashboardCharts classGroups={groups} isLoading={false} />)

    expect(useCentralizers).toHaveBeenCalledWith(
      ["c-1", "c-2"],
      1,
      expect.objectContaining({ limit: 200 })
    )

    await userEvent.click(screen.getByRole("tab", { name: /2do/i }))

    expect(useCentralizers).toHaveBeenLastCalledWith(
      ["c-1", "c-2"],
      2,
      expect.objectContaining({ limit: 200 })
    )
    expect(useClassGroupsRisk).toHaveBeenLastCalledWith(["cg-1", "cg-2"], 2)
  })

  /** La otra materia de la fila (10 y 100) no debe colarse en su promedio. */
  it("promedia cada curso sólo con su materia", () => {
    const { container } = render(
      <TechnicalDashboardCharts classGroups={groups} isLoading={false} />
    )

    expect(chartRows(container, "promedio")).toEqual([
      { name: "Quinto A", promedio: 70 },
      { name: "Sexto B", promedio: 40 },
    ])
    expect(chartRows(container, "Aprobados")).toEqual([
      { name: "Quinto A", Aprobados: 2, Reprobados: 0 },
      { name: "Sexto B", Aprobados: 0, Reprobados: 1 },
    ])
  })

  it("cuenta los atrasos como una serie propia de asistencia", () => {
    const { container } = render(
      <TechnicalDashboardCharts classGroups={groups} isLoading={false} />
    )

    expect(chartRows(container, "Atrasos")).toEqual([
      {
        name: "Quinto A",
        Presentes: 20,
        Atrasos: 6,
        Ausentes: 4,
        Licencias: 2,
      },
      {
        name: "Sexto B",
        Presentes: 10,
        Atrasos: 3,
        Ausentes: 2,
        Licencias: 1,
      },
    ])
    const fill = (key: string) =>
      container
        .querySelector(`[data-series="${key}"]`)
        ?.getAttribute("data-fill")
    expect(fill("Atrasos")).not.toBe(fill("Licencias"))
  })

  it("agrupa las predicciones de riesgo por nivel en cada curso", () => {
    const { container } = render(
      <TechnicalDashboardCharts classGroups={groups} isLoading={false} />
    )

    expect(chartRows(container, "Crítico")).toEqual([
      {
        name: "Quinto A",
        Crítico: 1,
        "En riesgo": 1,
        "Sin riesgo": 0,
        Sobresaliente: 0,
      },
      {
        name: "Sexto B",
        Crítico: 0,
        "En riesgo": 0,
        "Sin riesgo": 1,
        Sobresaliente: 0,
      },
    ])
  })

  /** Una lista vacía no debe leerse como una consulta fallida, ni al revés. */
  it("dice que la consulta falló en vez de dibujar un gráfico vacío", () => {
    useClassGroupsRisk.mockReturnValue({
      isPending: false,
      isError: true,
      data: [undefined, undefined],
    })

    render(<TechnicalDashboardCharts classGroups={groups} isLoading={false} />)

    expect(
      screen.getByText("No se pudo cargar la información.")
    ).toBeInTheDocument()
  })

  it("dice que no hay notas cuando nada está calificado", () => {
    useCentralizers.mockReturnValue({
      isPending: false,
      isError: false,
      data: [{ content: [] }, { content: [] }],
    })

    render(<TechnicalDashboardCharts classGroups={groups} isLoading={false} />)

    expect(
      screen.getAllByText("Sin notas registradas.").length
    ).toBeGreaterThan(0)
    expect(
      screen.queryByText("No se pudo cargar la información.")
    ).not.toBeInTheDocument()
  })

  it("le dice al docente sin materias qué le falta", () => {
    render(<TechnicalDashboardCharts classGroups={[]} isLoading={false} />)

    expect(
      screen.getByText(/aún no tienes materias asignadas/i)
    ).toBeInTheDocument()
  })
})
