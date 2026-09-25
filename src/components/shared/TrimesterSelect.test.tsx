import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

const useTrimesters = vi.hoisted(() => vi.fn())

// El catálogo lo lee react-query, que acá no tiene provider. Lo que se prueba es qué muestra el
// selector con un rango a la vista, no de dónde lo saca.
vi.mock("@/features/catalog/hooks/useCatalog", () => ({ useTrimesters }))

import { TrimesterSelect } from "./TrimesterSelect"

const periods = [
  { trimester: 1, startDate: "2026-02-01", endDate: "2026-04-30" },
  { trimester: 2, startDate: "2026-06-01", endDate: "2026-08-31" },
  { trimester: 3, startDate: "2026-09-01", endDate: "2026-11-30" },
]

describe("TrimesterSelect", () => {
  /**
   * El control dice qué trimestre está elegido. Nada más.
   *
   * Metía el rango comprimido adentro del propio botón — "1ro (1/2–30/4)" — y encima repetía las
   * mismas fechas completas debajo. Dos formatos de lo mismo, uno de ellos ilegible, y el que se
   * lee pegado al borde del control como si fuera parte de él.
   */
  it("el control nombra el trimestre sin meterle el rango adentro", () => {
    useTrimesters.mockReturnValue({ data: periods })

    render(<TrimesterSelect value={1} onChange={() => {}} />)

    expect(screen.getByRole("combobox")).toHaveTextContent("1er trimestre")
    expect(screen.getByRole("combobox")).not.toHaveTextContent("1/2")
  })

  /** Y la duración se lee entera, en el formato que usa cualquiera al hablar de una fecha. */
  it("muestra la duración del trimestre elegido, separada y legible", () => {
    useTrimesters.mockReturnValue({ data: periods })

    render(<TrimesterSelect value={2} onChange={() => {}} />)

    const range = screen.getByTestId("trimester-range")
    expect(range).toHaveTextContent("01 de junio")
    expect(range).toHaveTextContent("31 de agosto de 2026")
  })

  /**
   * El día del calendario no se corre con la zona horaria.
   *
   * La API manda `LocalDate` — "2026-02-01", sin hora ni zona — y `new Date` de un ISO sin hora
   * lo toma como medianoche UTC. Formateado en la zona de la escuela, cuatro horas atrás, el
   * trimestre empezaba el 31 de enero y terminaba el 29 de abril: un día menos en cada punta, en
   * un dato que decide qué fechas acepta la asistencia.
   */
  it("no corre el día por la zona horaria", () => {
    useTrimesters.mockReturnValue({ data: periods })

    render(<TrimesterSelect value={1} onChange={() => {}} />)

    const range = screen.getByTestId("trimester-range")
    expect(range).toHaveTextContent("01 de febrero de 2026")
    expect(range).toHaveTextContent("30 de abril de 2026")
    expect(range).not.toHaveTextContent("enero")
  })

  /** Un catálogo sin configurar no deja un rótulo vacío colgando bajo el control. */
  it("no muestra rango cuando el catálogo no trae el trimestre", () => {
    useTrimesters.mockReturnValue({ data: [] })

    render(<TrimesterSelect value={1} onChange={() => {}} />)

    expect(screen.queryByTestId("trimester-range")).toBeNull()
    expect(screen.getByRole("combobox")).toHaveTextContent("1er trimestre")
  })

  /** `showRange={false}` es lo que usan las pantallas que ya muestran las fechas por su cuenta. */
  it("respeta showRange en false", () => {
    useTrimesters.mockReturnValue({ data: periods })

    render(<TrimesterSelect value={1} onChange={() => {}} showRange={false} />)

    expect(screen.queryByTestId("trimester-range")).toBeNull()
  })
})
