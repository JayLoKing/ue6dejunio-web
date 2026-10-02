import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { TrimesterPeriodsPage } from "./TrimesterPeriodsPage"

interface YearsState {
  data:
    | { id: number; year: number; active: boolean; closed: boolean }[]
    | undefined
  isLoading: boolean
  isError: boolean
}

let years: YearsState
const periodsCalls: (number | null | undefined)[] = []

vi.mock("@/features/catalog/hooks/useCatalog", () => ({
  useAcademicYears: () => years,
}))

vi.mock("../hooks/useAcademic", () => ({
  useTrimesterPeriods: (id: number | null | undefined) => {
    periodsCalls.push(id)
    return { data: [], isLoading: false }
  },
  useCreateTrimesterPeriod: () => ({ mutate: vi.fn(), isPending: false }),
  useUpdateTrimesterPeriod: () => ({ mutate: vi.fn(), isPending: false }),
  useDeleteTrimesterPeriod: () => ({ mutate: vi.fn(), isPending: false }),
}))

const y2025 = { id: 1, year: 2025, active: false, closed: true }
const y2026 = { id: 2, year: 2026, active: true, closed: false }
const y2027 = { id: 3, year: 2027, active: false, closed: false }

beforeEach(() => {
  periodsCalls.length = 0
  years = { data: [y2025, y2026, y2027], isLoading: false, isError: false }
})

describe("TrimesterPeriodsPage", () => {
  it("defaults to the active year even when it is not first", () => {
    render(<TrimesterPeriodsPage />)
    expect(periodsCalls.at(-1)).toBe(2)
    expect(screen.getByRole("combobox")).toHaveTextContent("Gestión 2026")
  })

  it("queries the periods of the year the Director picks", async () => {
    render(<TrimesterPeriodsPage />)
    await userEvent.click(screen.getByRole("combobox"))
    await userEvent.click(
      await screen.findByRole("option", { name: "Gestión 2027" })
    )
    expect(periodsCalls.at(-1)).toBe(3)
  })

  it("renders a closed year read-only with a note", async () => {
    render(<TrimesterPeriodsPage />)
    await userEvent.click(screen.getByRole("combobox"))
    await userEvent.click(
      await screen.findByRole("option", { name: "Gestión 2025 (cerrada)" })
    )
    expect(periodsCalls.at(-1)).toBe(1)
    expect(
      screen.getByText(
        "La gestión está cerrada; reábrela en Gestiones para editar sus trimestres."
      )
    ).toBeInTheDocument()
    for (const input of screen.getAllByLabelText(/Inicio|Fin/)) {
      expect(input).toBeDisabled()
    }
    for (const button of screen.getAllByRole("button", {
      name: /Configurar/,
    })) {
      expect(button).toBeDisabled()
    }
  })

  it("shows the empty state when no year is active", () => {
    years = { data: [y2025, y2027], isLoading: false, isError: false }
    render(<TrimesterPeriodsPage />)
    expect(
      screen.getByText(
        "No hay una gestión activa. Actívala en Gestiones o elige una."
      )
    ).toBeInTheDocument()
    expect(screen.queryByLabelText("Inicio")).not.toBeInTheDocument()
  })

  it("shows an error state, not the empty one, when the years fetch fails", () => {
    years = { data: undefined, isLoading: false, isError: true }
    render(<TrimesterPeriodsPage />)
    expect(screen.getByRole("alert")).toBeInTheDocument()
    expect(
      screen.queryByText(/No hay una gestión activa/)
    ).not.toBeInTheDocument()
  })
})
