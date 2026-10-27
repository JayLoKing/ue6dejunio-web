import { describe, expect, it } from "vitest"

import { addColorMixFallbacks } from "./color-mix-fallback"

const THEME =
  ":root{--background:#fdfbf7;--destructive:#c72e2b;--success:var(--primary);--primary:#13543d;--border:#e2dfda}" +
  ".dark{--destructive:#f05b52;--primary:#59ba98;--border:#f5f2e91f}"

const mixed = (selector: string, prop: string, token: string, pct: number) =>
  `.a{${prop}:var(${token})}@supports (color:color-mix(in lab, red, red)){${selector}{${prop}:color-mix(in oklab, var(${token}) ${pct}%, transparent)}}`

describe("addColorMixFallbacks", () => {
  it("puts an rgb fallback before the color-mix block, so old browsers keep the transparency", () => {
    const css =
      THEME +
      mixed(".bg-destructive\\/10", "background-color", "--destructive", 10)

    const out = addColorMixFallbacks(css)

    const fallback =
      ".bg-destructive\\/10{background-color:rgb(var(--destructive-rgb) / calc(var(--destructive-a) * 10%))}"
    expect(out).toContain(
      fallback + "@supports (color:color-mix(in lab, red, red)){"
    )
  })

  it("declares the channels of every mixed token in the light and the dark theme", () => {
    const css = THEME + mixed(".x", "color", "--destructive", 50)

    const out = addColorMixFallbacks(css)

    expect(out).toContain(
      ":root{--background:#fdfbf7;--destructive:#c72e2b;--success:var(--primary);--primary:#13543d;--border:#e2dfda;--destructive-rgb:199 46 43;--destructive-a:1}"
    )
    expect(out).toContain(
      ".dark{--destructive:#f05b52;--primary:#59ba98;--border:#f5f2e91f;--destructive-rgb:240 91 82;--destructive-a:1}"
    )
  })

  it("follows an alias through the theme it is read in", () => {
    const css = THEME + mixed(".x", "background-color", "--success", 12)

    const out = addColorMixFallbacks(css)

    expect(out).toContain("--success-rgb:19 84 61;--success-a:1}")
    expect(out).toContain("--success-rgb:89 186 152;--success-a:1}")
  })

  it("keeps the alpha a token already carries", () => {
    const css = THEME + mixed(".x", "border-color", "--border", 50)

    const out = addColorMixFallbacks(css)

    expect(out).toContain("--border-rgb:245 242 233;--border-a:0.122}")
  })

  it("leaves Tailwind palette colors alone, their fallback is already a hex with alpha", () => {
    const css = THEME + mixed(".x", "border-color", "--color-amber-500", 30)

    expect(addColorMixFallbacks(css)).toBe(css)
  })

  it("leaves a token it cannot resolve alone instead of emitting an invalid fallback", () => {
    const css = THEME + mixed(".x", "background-color", "--unknown", 10)

    expect(addColorMixFallbacks(css)).toBe(css)
  })
})
