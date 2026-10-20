import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import { describe, expect, it } from "vitest"

const root = process.cwd()

describe("application branding", () => {
  it("uses the school name and Spanish document language", () => {
    const html = readFileSync(resolve(root, "index.html"), "utf8")
    const document = new DOMParser().parseFromString(html, "text/html")

    expect(document.title).toBe("U.E. 6 de Junio | Sistema Académico")
    expect(document.documentElement.lang).toBe("es")
  })

  it("links an available school SVG favicon instead of Vite branding", () => {
    const html = readFileSync(resolve(root, "index.html"), "utf8")
    const document = new DOMParser().parseFromString(html, "text/html")
    const icon = document.querySelector('link[rel="icon"]')

    expect(icon?.getAttribute("href")).toBe("/favicon.svg")
    expect(icon?.getAttribute("type")).toBe("image/svg+xml")
    const svg = readFileSync(resolve(root, "public/favicon.svg"), "utf8")
    const image = new DOMParser().parseFromString(svg, "image/svg+xml")
    expect(image.querySelector("parsererror")).toBeNull()
    expect(image.documentElement.localName).toBe("svg")
    expect(image.documentElement.getAttribute("viewBox")).toBe("0 0 24 24")
  })
})