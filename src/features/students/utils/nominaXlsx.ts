import type { NominaBlock, ParsedStudentRow, RejectedNominaRow } from "../types"
import { normalizeGradeName } from "./rosterHeader"

/** Lo justo del curso destino para elegir su bloque en la planilla. */
export interface NominaTargetCourse {
  gradeName: string
  parallelName: string
}

const fold = (s: string): string =>
  s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim()

const collapse = (s: string): string => s.replace(/\s+/g, " ").trim()

const INICIAL = "Inicial"

/**
 * El grado con el nombre del catálogo, incluido Inicial, que la nómina del SIE no trae y la planilla
 * de la escuela sí. Null si la palabra no es un grado.
 */
const nominaGrade = (raw: string): string | null => {
  const first = fold(raw).split(" ")[0] ?? ""
  if (first === "inicial") return INICIAL
  return normalizeGradeName(first)
}

/** Los textos de la tabla compartida, en orden: un `<v>` de tipo "s" es un índice de esta lista. */
export const sharedStringsFromXml = (xml: string): string[] => {
  const doc = new DOMParser().parseFromString(xml, "application/xml")
  return Array.from(doc.getElementsByTagName("si")).map(textOf)
}

/**
 * El texto de un `<si>` o un `<is>`: todos sus `<t>`, uno detrás del otro. Un texto con formato
 * llega partido en varios tramos (`<r><t>`); la guía fonética (`<rPh>`) no es parte del texto.
 */
const textOf = (el: Element): string =>
  Array.from(el.getElementsByTagName("t"))
    .filter((t) => t.parentElement?.localName !== "rPh")
    .map((t) => t.textContent ?? "")
    .join("")

/** "B12" → "B". */
const columnOf = (ref: string): string => ref.replace(/\d+$/, "")

const cellText = (c: Element, shared: string[]): string => {
  const type = c.getAttribute("t")
  if (type === "inlineStr") {
    const is = c.getElementsByTagName("is")[0]
    return is ? textOf(is) : ""
  }
  const v = c.getElementsByTagName("v")[0]?.textContent ?? ""
  if (type === "s") return shared[Number(v)] ?? ""
  return v
}

interface SheetRow {
  rowNumber: number
  cells: Record<string, string>
}

const rowsOf = (sheetXml: string, shared: string[]): SheetRow[] => {
  const doc = new DOMParser().parseFromString(sheetXml, "application/xml")
  return Array.from(doc.getElementsByTagName("row")).map((row) => {
    const cells: Record<string, string> = {}
    for (const c of Array.from(row.getElementsByTagName("c"))) {
      const ref = c.getAttribute("r")
      if (!ref) continue
      cells[columnOf(ref)] = collapse(cellText(c, shared))
    }
    return { rowNumber: Number(row.getAttribute("r")), cells }
  })
}

const COURSE_RE = /^curso\s*:\s*(.+)$/i

/**
 * El grado y el paralelo de una línea "CURSO:  PRIMERO    A".
 *
 * Los espacios son irregulares y hay una errata con la letra pegada al grado ("CUARTOC   C"): si
 * la primera palabra no es un grado pero lo es sin su última letra, esa letra sobra.
 */
const courseOf = (text: string): { grade: string; parallel: string } | null => {
  const match = text.match(COURSE_RE)
  if (!match) return null
  const tokens = collapse(match[1]).toUpperCase().split(" ")
  const first = tokens[0] ?? ""

  let grade = nominaGrade(first)
  let glued: string | null = null
  if (!grade && /[A-Z]$/.test(first)) {
    grade = nominaGrade(first.slice(0, -1))
    glued = first.slice(-1)
  }
  const last = tokens.length > 1 ? tokens[tokens.length - 1] : glued
  if (!grade || !last || !/^[A-Z]$/.test(last)) return null
  return { grade, parallel: last }
}

const isTitle = (text: string): boolean =>
  fold(text).startsWith("nomina de estudiantes")

const isHeader = (row: SheetRow): boolean =>
  fold(row.cells.B ?? "") === "apellidos y nombres" ||
  fold(row.cells.A ?? "") === "no"

/**
 * Apellidos y nombres de un nombre escrito con los apellidos primero.
 *
 * Tres palabras o más: las dos primeras son los apellidos. Dos: una y una. Una sola no se puede
 * separar, y la fila se rechaza. No tiene que acertar siempre: la nómina del SIE que se importe
 * después reconoce al estudiante por el nombre completo, no por dónde se cortó.
 */
export const splitNominaName = (
  raw: string
): { lastNames: string; names: string } | null => {
  const tokens = collapse(raw).split(" ").filter(Boolean)
  if (tokens.length < 2) return null
  const cut = tokens.length === 2 ? 1 : 2
  return {
    lastNames: tokens.slice(0, cut).join(" "),
    names: tokens.slice(cut).join(" "),
  }
}

const ONE_WORD =
  "Tiene una sola palabra: no se pueden separar apellidos y nombres."

/**
 * Los cursos de una hoja de la planilla, cada uno con sus estudiantes.
 *
 * Una fila es de un estudiante si trae nombre en la columna B, tenga número o no; un número sin
 * nombre se salta. La columna C lleva notas sueltas (NUEVO, REPIT…) y no se lee. Lo que haya antes
 * de la primera línea de curso no pertenece a ninguno.
 */
export const nominaBlocksFromSheet = (
  sheetXml: string,
  shared: string[]
): NominaBlock[] => {
  const blocks: NominaBlock[] = []
  let current: NominaBlock | null = null

  for (const row of rowsOf(sheetXml, shared)) {
    const name = row.cells.B ?? ""
    const course = courseOf(name)
    if (course) {
      current = { ...course, rows: [], rejected: [] }
      blocks.push(current)
      continue
    }
    if (!current || !name || isTitle(name) || isHeader(row)) continue

    const split = splitNominaName(name)
    if (!split) {
      const rejected: RejectedNominaRow = {
        rowNumber: row.rowNumber,
        rawFullName: name,
        reason: ONE_WORD,
      }
      current.rejected.push(rejected)
      continue
    }
    const student: ParsedStudentRow = {
      rowIndex: current.rows.length + 1,
      rawFullName: name,
      fullName: name,
      ...split,
    }
    current.rows.push(student)
  }
  return blocks
}

const describeBlock = (b: { grade: string; parallel: string }) =>
  `${b.grade} ${b.parallel}`

/**
 * El bloque del curso destino, o por qué no está.
 *
 * El grado del curso pasa por el mismo normalizador que el de la planilla, así un catálogo escrito
 * en mayúsculas o con otra grafía no se pierde su bloque. No se compara el año: el título de la
 * planilla dice una gestión que no es la suya.
 */
export const nominaBlockFor = (
  blocks: NominaBlock[],
  course: NominaTargetCourse
): { block: NominaBlock } | { error: string } => {
  if (blocks.length === 0) {
    return {
      error:
        "No se encontró ningún curso en la planilla. Verifica que sea la nómina de estudiantes (líneas «CURSO: …»).",
    }
  }
  const grade = nominaGrade(course.gradeName) ?? course.gradeName.trim()
  const parallel = course.parallelName.trim().toUpperCase()

  const block = blocks.find((b) => b.grade === grade && b.parallel === parallel)
  if (block) return { block }
  return {
    error: `La planilla no tiene el curso ${describeBlock({
      grade,
      parallel,
    })}. Cursos encontrados: ${blocks.map(describeBlock).join(", ")}.`,
  }
}
