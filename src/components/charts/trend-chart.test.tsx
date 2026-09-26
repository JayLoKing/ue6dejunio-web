import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

vi.mock("@visx/responsive", () => ({
  ParentSize: ({
    children,
  }: {
    children: (size: { width: number; height: number }) => React.ReactNode
  }) => children({ width: 400, height: 200 }),
}))

import { TrendChart } from "./trend-chart"

const series = [
  {
    label: "Promedio",
    color: "var(--chart-1)",
    points: [
      { x: "1er", y: 62 },
      { x: "2do", y: 68 },
      { x: "3er", y: 71 },
    ],
  },
]

describe("TrendChart", () => {
  it("rotula cada punto del eje", () => {
    render(<TrendChart series={series} />)

    expect(screen.getByText("1er")).toBeInTheDocument()
    expect(screen.getByText("3er")).toBeInTheDocument()
  })

  it("nombra la serie en la leyenda", () => {
    render(<TrendChart series={series} />)

    expect(screen.getByRole("list", { name: /leyenda/i })).toHaveTextContent(
      "Promedio"
    )
  })

  /**
   * Un trimestre sin medir es un hueco, no un cero. Bajar la línea hasta el piso dibuja un derrumbe
   * que nunca pasó — la misma regla que sostiene el modelo en el repositorio de IA.
   */
  it("un punto sin medir no se dibuja como cero", () => {
    render(
      <TrendChart
        series={[
          {
            label: "Recall",
            color: "var(--chart-2)",
            points: [
              { x: "1er", y: 40 },
              { x: "2do", y: null },
              { x: "3er", y: 55 },
            ],
          },
        ]}
      />
    )

    // Dos marcas, no tres: la del medio no existe.
    expect(screen.getAllByRole("img", { name: /Recall en/ })).toHaveLength(2)
  })

  it("sin series lo dice en vez de dibujar ejes vacíos", () => {
    render(<TrendChart series={[]} />)

    expect(screen.getByText(/sin datos/i)).toBeInTheDocument()
  })

  /** Y una serie declarada pero sin una sola medición cuenta como sin datos. */
  it("una serie sin mediciones cuenta como sin datos", () => {
    render(
      <TrendChart
        series={[
          {
            label: "Promedio",
            color: "var(--chart-1)",
            points: [
              { x: "1er", y: null },
              { x: "2do", y: null },
            ],
          },
        ]}
      />
    )

    expect(screen.getByText(/sin datos/i)).toBeInTheDocument()
  })
})
