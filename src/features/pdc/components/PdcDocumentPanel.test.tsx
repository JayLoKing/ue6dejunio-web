import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { PdcDocumentPanel } from "./PdcDocumentPanel"
import type { Pdc } from "../types"
import { DEFAULT_ZOOM } from "../utils/zoom"

const plan = (over: Partial<Pdc> = {}): Pdc =>
  ({
    id: "p-1",
    planNumber: 4,
    trimester: 2,
    periodStart: "2026-08-03",
    periodEnd: "2026-09-04",
    status: "Published",
    courseName: 'Quinto "B"',
    levelName: "Primaria Comunitaria Vocacional",
    homeroomTeacherName: "Ana Pérez",
    holisticObjective: "Fortalecemos la práctica de valores.",
    finalProduct: null,
    bibliography: null,
    subjects: [],
    ...over,
  }) as Pdc

describe("PdcDocumentPanel", () => {
  it("shows the plan as the form it is handed in as", () => {
    render(<PdcDocumentPanel plan={plan()} />)

    expect(
      screen.getByText(/PLAN DE DESARROLLO CURRICULAR Nº 4/)
    ).toBeInTheDocument()
  })

  // The sheet is a Letter page on its side, wider than the panel it sits in, so it opens reduced.
  it("opens at the size the sheet fits the panel at", () => {
    render(<PdcDocumentPanel plan={plan()} />)

    expect(
      screen.getByText(`${Math.round(DEFAULT_ZOOM * 100)}%`)
    ).toBeInTheDocument()
  })

  it("opens the sheet up a step at a time", async () => {
    render(<PdcDocumentPanel plan={plan()} />)

    await userEvent.click(
      screen.getByRole("button", { name: "Acercar la vista previa" })
    )

    expect(screen.getByText("75%")).toBeInTheDocument()
  })

  // The scale is a fixed set of steps, not a free number: the smallest one has nothing under it.
  it("does not reduce the sheet past the smallest step", () => {
    render(<PdcDocumentPanel plan={plan()} />)

    expect(
      screen.getByRole("button", { name: "Alejar la vista previa" })
    ).toBeEnabled()
  })

  it("hands the document to the printer", async () => {
    const print = vi.fn()
    vi.stubGlobal("print", print)

    render(<PdcDocumentPanel plan={plan()} />)
    await userEvent.click(
      screen.getByRole("button", { name: /Imprimir o PDF/ })
    )

    expect(print).toHaveBeenCalledOnce()
    vi.unstubAllGlobals()
  })
})
