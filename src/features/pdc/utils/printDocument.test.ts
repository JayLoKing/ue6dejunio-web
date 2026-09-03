import { describe, expect, it } from "vitest"

import { printableDocumentOf } from "./printDocument"

describe("printableDocumentOf", () => {
  const html = "<table><tr><td>Semana 1</td></tr></table>"

  it("carries the document it was given", () => {
    const doc = printableDocumentOf(html, "Plan Nº 4")

    expect(doc).toContain(html)
    expect(doc).toContain("<title>Plan Nº 4</title>")
  })

  // The whole reason this exists. Printed from the page, the document sits inside a dialog: a
  // fixed, transformed, overflow-clipped box that an absolutely positioned child cannot escape, so
  // the sheet came out cropped. Standing on its own there is nothing to escape from.
  it("stands on its own rather than inside the app", () => {
    const doc = printableDocumentOf(html, "Plan")

    expect(doc).toMatch(/^<!doctype html>/i)
    expect(doc).toContain("<body")
  })

  // Browsers drop background colours when printing unless the page insists. Without this the two
  // greens of the form — the band over every subject table, the adaptations header — print white,
  // and the sheet stops looking like the form it is.
  it("insists on the form's fills reaching the paper", () => {
    const doc = printableDocumentOf(html, "Plan")

    expect(doc).toContain("print-color-adjust: exact")
    expect(doc).toContain("-webkit-print-color-adjust: exact")
  })

  it("sets the page up the way the template does", () => {
    const doc = printableDocumentOf(html, "Plan")

    expect(doc).toContain("size: letter landscape")
    expect(doc).toContain("margin: 0.5in")
  })

  // The screen reduces the sheet to fit a panel. Paper has a size of its own.
  it("prints the sheet full size whatever the screen showed", () => {
    expect(printableDocumentOf(html, "Plan")).toContain("zoom: 1")
  })

  it("carries the form's own borders and typeface", () => {
    const doc = printableDocumentOf(html, "Plan")

    expect(doc).toContain("Arial Narrow")
    expect(doc).toContain("border-collapse: collapse")
    expect(doc).toMatch(/td,\s*th\s*\{[^}]*border:\s*1px solid/)
  })

  // The two greens are the template's own, read out of the .docx. They are what makes a printed
  // sheet recognisable as the form rather than as a grid of text.
  it("carries the two fills the template shades with", () => {
    const doc = printableDocumentOf(html, "Plan")

    expect(doc).toContain("#E2EFD9")
    expect(doc).toContain("#A8D08D")
  })

  it("escapes a title that carries markup", () => {
    expect(
      printableDocumentOf(html, 'Plan <script>alert("x")</script>')
    ).not.toContain("<script>alert")
  })
})
