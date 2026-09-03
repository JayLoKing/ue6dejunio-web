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

  // Printing the sheet where it is drawn does not work: it sits inside a dialog, which is a fixed,
  // transformed, scrolling box that a print stylesheet cannot lift a child out of. The sheet came
  // out cropped and without the form's fills. So the document is handed to a page of its own.
  it("prints the document on a page of its own, not the app's", async () => {
    const print = vi.fn()
    vi.stubGlobal("print", print)

    render(<PdcDocumentPanel plan={plan()} />)
    await userEvent.click(
      screen.getByRole("button", { name: /Imprimir o PDF/ })
    )

    const frame = document.querySelector("iframe")
    expect(frame).not.toBeNull()
    expect(frame?.srcdoc).toContain("PLAN DE DESARROLLO CURRICULAR")
    // Backgrounds are the first thing a browser drops when printing, and the two greens are what
    // make the sheet the form rather than a grid of text.
    expect(frame?.srcdoc).toContain("print-color-adjust: exact")
    // Whatever is printed, it is never the page the document is embedded in.
    expect(print).not.toHaveBeenCalled()

    vi.unstubAllGlobals()
  })

  // .doc is Word 97. What the school is asked for, and what every other reader opens, is a package.
  it("offers the plan as a .docx rather than as a renamed web page", () => {
    render(<PdcDocumentPanel plan={plan()} />)

    expect(
      screen.getByRole("button", { name: /Descargar \.docx/ })
    ).toBeInTheDocument()
    expect(
      screen.queryByRole("button", { name: /Descargar \.doc$/ })
    ).not.toBeInTheDocument()
  })
})
