import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

// jsdom no hace layout, así que `ParentSize` mide cero de ancho y el anillo nunca llega a
// dibujarse. Se le da un tamaño fijo: lo que se prueba es este componente, no el medidor de visx.
vi.mock("@visx/responsive", () => ({
  ParentSize: ({
    children,
  }: {
    children: (size: { width: number; height: number }) => React.ReactNode
  }) => children({ width: 200, height: 200 }),
}))

import { DonutChart } from "./donut-chart"

const slices = [
  { label: "Aprobados", value: 23, color: "var(--chart-1)" },
  { label: "Reprobados", value: 7, color: "var(--chart-3)" },
]

describe("DonutChart", () => {
  it("dibuja un sector por dato", () => {
    render(<DonutChart data={slices} />)

    expect(screen.getByRole("img", { name: /Aprobados/ })).toBeInTheDocument()
    expect(screen.getByRole("img", { name: /Reprobados/ })).toBeInTheDocument()
  })

  /** El total va en el centro: es el número que contextualiza a todos los demás. */
  it("muestra el total en el centro", () => {
    render(<DonutChart data={slices} />)

    expect(screen.getByTestId("donut-total")).toHaveTextContent("30")
  })

  /** Y el rótulo del centro se puede nombrar, porque "30" solo no dice 30 de qué. */
  it("acepta un rótulo para el total", () => {
    render(<DonutChart data={slices} centerLabel="estudiantes" />)

    expect(screen.getByText("estudiantes")).toBeInTheDocument()
  })

  /**
   * La leyenda lleva el valor y el porcentaje. Un anillo sin números se lee "más o menos un
   * cuarto", que no es una medición — y para quien no distingue los colores, es lo único que hay.
   */
  it("la leyenda nombra cada parte con su valor y su porcentaje", () => {
    render(<DonutChart data={slices} />)

    const legend = screen.getByRole("list", { name: /leyenda/i })
    expect(legend).toHaveTextContent("Aprobados")
    expect(legend).toHaveTextContent("23")
    expect(legend).toHaveTextContent("77%")
  })

  /**
   * Cero total no es un anillo vacío dibujado como si fuera un dato: es que todavía no hay nada que
   * mostrar, y el gráfico tiene que decirlo en palabras.
   */
  it("sin datos lo dice en vez de dibujar un anillo vacío", () => {
    render(<DonutChart data={[]} />)

    expect(screen.getByText(/sin datos/i)).toBeInTheDocument()
    expect(screen.queryByTestId("donut-total")).toBeNull()
  })

  /** Todos los valores en cero cuenta como sin datos: un anillo de radio cero no comunica nada. */
  it("con todos los valores en cero tampoco dibuja el anillo", () => {
    render(
      <DonutChart
        data={[
          { label: "Aprobados", value: 0, color: "var(--chart-1)" },
          { label: "Reprobados", value: 0, color: "var(--chart-3)" },
        ]}
      />
    )

    expect(screen.getByText(/sin datos/i)).toBeInTheDocument()
  })
})
