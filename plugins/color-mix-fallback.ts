import type { Plugin } from "vite"

/*
 * Chrome 109 (the last release for Windows 7, which the school still runs) has no color-mix().
 * Tailwind writes every opacity modifier on a theme color, such as `bg-destructive/10`, as a
 * fallback with the plain variable followed by the color-mix() version behind @supports. The
 * fallback drops the alpha, so that browser paints the tint at full strength: a badge ends up with
 * the same background as its text, and the active row of a table turns solid.
 *
 * This pass runs on the built CSS. Before each such @supports block it writes the same rules with
 * `rgb(var(--token-rgb) / ...)`, which Chrome 109 understands, and it declares those channels in
 * :root and .dark from the hex values Lightning CSS already emitted for each theme. Browsers with
 * color-mix() still apply the @supports rule, because it comes later in the cascade.
 */

const SUPPORTS = "@supports (color:color-mix(in lab, red, red)){"
const MIX = /color-mix\(in oklab, var\((--[\w-]+)\) ([\d.]+)%, transparent\)/g
const RULE = /([^{}]+)\{([^{}]*)\}/g

interface Channels {
  rgb: string
  alpha: number
}

// A token's channels in each theme; `dark` is null when the CSS has no .dark block.
interface ThemeChannels {
  light: Channels
  dark: Channels | null
}

interface Theme {
  close: number
  vars: Map<string, string>
}

export function addColorMixFallbacks(css: string): string {
  const light = findTheme(css, ":root{")
  const dark = findTheme(css, ".dark{")
  if (!light) return css

  const used = new Map<string, ThemeChannels>()
  const resolve = (token: string): ThemeChannels | null => {
    if (token.startsWith("--color-")) return null
    if (used.has(token)) return used.get(token)!
    const lightChannels = channelsOf(token, [light.vars])
    if (!lightChannels) return null
    const darkChannels = dark
      ? channelsOf(token, [dark.vars, light.vars])
      : null
    const entry = { light: lightChannels, dark: darkChannels }
    used.set(token, entry)
    return entry
  }

  let out = ""
  let cursor = 0
  for (
    let start = css.indexOf(SUPPORTS);
    start >= 0;
    start = css.indexOf(SUPPORTS, start + 1)
  ) {
    const end = closingBrace(css, start + SUPPORTS.length - 1)
    const body = css.slice(start + SUPPORTS.length, end)
    if (body.includes("@")) continue
    const fallbacks = fallbackRules(body, resolve)
    if (!fallbacks) continue
    out += css.slice(cursor, start) + fallbacks
    cursor = start
  }
  out += css.slice(cursor)
  if (used.size === 0) return css

  return injectChannels(out, used)
}

function fallbackRules(
  body: string,
  resolve: (token: string) => unknown
): string {
  let rules = ""
  for (const [, selector, declarations] of body.matchAll(RULE)) {
    const rewritten = declarations
      .split(";")
      .filter((declaration) => {
        const tokens = [...declaration.matchAll(MIX)].map((match) => match[1])
        return tokens.length > 0 && tokens.every((token) => resolve(token))
      })
      .map((declaration) =>
        declaration.replace(
          MIX,
          (_, token: string, pct: string) =>
            `rgb(var(${token}-rgb) / calc(var(${token}-a) * ${pct}%))`
        )
      )
    if (rewritten.length > 0) rules += `${selector}{${rewritten.join(";")}}`
  }
  return rules
}

function injectChannels(css: string, used: Map<string, ThemeChannels>): string {
  const declare = (pick: (entry: ThemeChannels) => Channels | null) =>
    [...used]
      .map(([token, entry]) => [token, pick(entry)] as const)
      .filter((pair): pair is readonly [string, Channels] => pair[1] !== null)
      .map(([token, c]) => `;${token}-rgb:${c.rgb};${token}-a:${c.alpha}`)
      .join("")

  // The dark block comes after :root, so inserting into it first keeps the :root offsets valid.
  let out = css
  const dark = findTheme(out, ".dark{")
  if (dark)
    out =
      out.slice(0, dark.close) + declare((e) => e.dark) + out.slice(dark.close)
  const light = findTheme(out, ":root{")!
  return (
    out.slice(0, light.close) + declare((e) => e.light) + out.slice(light.close)
  )
}

// The first block with this selector that defines plain variables, which is the hex one Lightning
// CSS writes; the lab() overrides it adds later live behind their own @supports.
function findTheme(css: string, opener: string): Theme | null {
  for (
    let open = css.indexOf(opener);
    open >= 0;
    open = css.indexOf(opener, open + 1)
  ) {
    if (open > 0 && !/[}\s]/.test(css[open - 1])) continue
    const close = closingBrace(css, open + opener.length - 1)
    const body = css.slice(open + opener.length, close)
    if (!/^--[\w-]+:/.test(body)) continue
    const vars = new Map<string, string>()
    for (const declaration of body.split(";")) {
      const colon = declaration.indexOf(":")
      if (colon > 0)
        vars.set(
          declaration.slice(0, colon).trim(),
          declaration.slice(colon + 1).trim()
        )
    }
    return { close, vars }
  }
  return null
}

function channelsOf(
  token: string,
  scopes: Map<string, string>[],
  depth = 0
): Channels | null {
  if (depth > 8) return null
  const value = scopes
    .map((scope) => scope.get(token))
    .find((v) => v !== undefined)
  if (!value) return null
  const alias = /^var\((--[\w-]+)\)$/.exec(value)
  if (alias) return channelsOf(alias[1], scopes, depth + 1)
  return parseHex(value)
}

function parseHex(value: string): Channels | null {
  const hex = /^#([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i.exec(value)?.[1]
  if (!hex) return null
  const full = hex.length <= 4 ? [...hex].map((c) => c + c).join("") : hex
  const [r, g, b, a = 255] = full
    .match(/../g)!
    .map((pair) => parseInt(pair, 16))
  return { rgb: `${r} ${g} ${b}`, alpha: Math.round((a / 255) * 1000) / 1000 }
}

function closingBrace(css: string, openIndex: number): number {
  let depth = 0
  for (let i = openIndex; i < css.length; i++) {
    if (css[i] === "{") depth++
    else if (css[i] === "}" && --depth === 0) return i
  }
  return css.length
}

export function colorMixFallback(): Plugin {
  return {
    name: "color-mix-fallback",
    apply: "build",
    enforce: "post",
    generateBundle(_, bundle) {
      for (const file of Object.values(bundle)) {
        if (
          file.type === "asset" &&
          file.fileName.endsWith(".css") &&
          typeof file.source === "string"
        ) {
          file.source = addColorMixFallbacks(file.source)
        }
      }
    },
  }
}
