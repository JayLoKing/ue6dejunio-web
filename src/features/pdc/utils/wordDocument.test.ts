import { describe, expect, it } from "vitest"

import { wordDocumentOf } from "./wordDocument"

describe("wordDocumentOf", () => {
  const html = "<table><tr><td>Semana 1</td></tr></table>"

  // Word opens an HTML file as a document when it is announced as one. Without the Office
  // namespaces it lands as a web page and the page setup is ignored.
  it("wraps the markup in a document Word will open", () => {
    const doc = wordDocumentOf(html, "Plan Nº 4")

    expect(doc).toContain("xmlns:w=\"urn:schemas-microsoft-com:office:word\"")
    expect(doc).toContain("<title>Plan Nº 4</title>")
    expect(doc).toContain(html)
  })

  // The template is Letter landscape with half-inch margins. Printed portrait, or on A4, the
  // weekly table runs off the page.
  it("sets the page up the way the template does", () => {
    const doc = wordDocumentOf(html, "Plan")

    expect(doc).toContain("size: letter landscape")
    expect(doc).toContain("margin: 0.5in")
  })

  // Word has the font; the browser may not. Either way the file names what the template names.
  it("asks for the template's own typeface", () => {
    expect(wordDocumentOf(html, "Plan")).toContain("Arial Narrow")
  })

  // The document travels alone: Word has no access to the app's stylesheet, so the borders that
  // make the form a form have to be inside the file.
  it("carries the table borders with it", () => {
    const doc = wordDocumentOf(html, "Plan")

    expect(doc).toContain("border-collapse: collapse")
    expect(doc).toMatch(/td,\s*th\s*\{[^}]*border:\s*1px solid/)
  })

  it("escapes a title that carries markup", () => {
    expect(wordDocumentOf(html, 'Plan <script>alert("x")</script>')).not.toContain("<script>")
  })
})
