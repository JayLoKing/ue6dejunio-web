import { render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import type { Pdc } from "../types"

const progress = vi.hoisted(() => ({
  current: {} as Record<string, unknown>,
}))

vi.mock("../hooks/usePdc", () => ({
  usePdcProgress: () => progress.current,
  useAddProgress: () => ({ mutate: vi.fn(), isPending: false }),
}))

import { PdcProgressDialog } from "./PdcProgressDialog"

const plan = { id: "p-1", planNumber: 3, courseName: "1ro A" } as Pdc

const entry = {
  id: "e-1",
  pdcId: "p-1",
  progressDate: "2026-05-04",
  advancedContent: "Fracciones equivalentes",
  percentage: 40,
  observations: null,
}

describe("PdcProgressDialog", () => {
  beforeEach(() => {
    progress.current = { isLoading: false, isError: false, data: [entry] }
  })

  // The teacher reports progress on their own plan, so the form is there.
  it("offers the form to whoever reports the progress", () => {
    render(<PdcProgressDialog pdc={plan} onClose={vi.fn()} />)

    expect(screen.getByLabelText("Contenido avanzado")).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: "Registrar avance" })
    ).toBeInTheDocument()
    expect(screen.getByText("Fracciones equivalentes")).toBeInTheDocument()
  })

  // The Director follows the plan, they do not report on it: the history and nothing to write with.
  it("shows only the history when read-only", () => {
    render(<PdcProgressDialog pdc={plan} readOnly onClose={vi.fn()} />)

    expect(screen.getByText("Fracciones equivalentes")).toBeInTheDocument()
    expect(
      screen.queryByLabelText("Contenido avanzado")
    ).not.toBeInTheDocument()
    expect(screen.queryByLabelText("Fecha")).not.toBeInTheDocument()
    expect(
      screen.queryByRole("button", { name: "Registrar avance" })
    ).not.toBeInTheDocument()
  })

  it("says so when no progress has been reported yet", () => {
    progress.current = { isLoading: false, isError: false, data: [] }

    render(<PdcProgressDialog pdc={plan} readOnly onClose={vi.fn()} />)

    expect(
      screen.getByText("Aún no hay avances registrados.")
    ).toBeInTheDocument()
  })

  // A failed fetch must not read as "nothing reported": that is a different answer.
  it("reports a failed fetch instead of an empty history", () => {
    progress.current = { isLoading: false, isError: true, data: undefined }

    render(<PdcProgressDialog pdc={plan} readOnly onClose={vi.fn()} />)

    expect(
      screen.getByText("No se pudieron cargar los avances.")
    ).toBeInTheDocument()
    expect(
      screen.queryByText("Aún no hay avances registrados.")
    ).not.toBeInTheDocument()
  })
})
