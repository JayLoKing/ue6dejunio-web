import type { SchoolRoster, SchoolRosterBlock } from "../types"
import { nominaGrade } from "./nominaXlsx"
import { studentRowsFromItems, type TextItem } from "./pdfParser"
import {
  normalizeGradeName,
  rosterHeaderMismatch,
  rosterYearFromItems,
  type RosterTargetCourse,
} from "./rosterHeader"

const fold = (s: string): string =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim()

/** Los encabezados de bloque (nivel, turno, año, paralelo) van en la columna izquierda. */
const LEFT_COLUMN_X = 150
/** pt: lo que se le concede a un renglón partido para quedar en el bloque de su estudiante. */
const LINE_TOLERANCE = 2

const SCHOOLING_RE = /^ano de escolaridad\s*:\s*(\d+)?$/
const PARALLEL_RE = /^paralelo\s*:\s*([a-z])?$/
const LEVEL_RE = /^(inicial|primaria|secundaria)\b/
const SHIFT_RE = /^(manana|tarde|noche)$/

type Heading =
  | { kind: "level"; item: TextItem; level: string }
  | { kind: "schooling"; item: TextItem; value: number | null }
  | { kind: "parallel"; item: TextItem; value: string | null }
  | { kind: "shift"; item: TextItem }

const headingOf = (it: TextItem): Heading | null => {
  if (it.x >= LEFT_COLUMN_X) return null
  const text = fold(it.str)
  const schooling = text.match(SCHOOLING_RE)
  if (schooling) {
    return {
      kind: "schooling",
      item: it,
      value: schooling[1] ? Number(schooling[1]) : null,
    }
  }
  const parallel = text.match(PARALLEL_RE)
  if (parallel) {
    return {
      kind: "parallel",
      item: it,
      value: parallel[1]?.toUpperCase() ?? null,
    }
  }
  const level = text.match(LEVEL_RE)
  if (level) return { kind: "level", item: it, level: level[1] }
  if (SHIFT_RE.test(text)) return { kind: "shift", item: it }
  return null
}

/**
 * El valor que pdfjs entregó aparte de su etiqueta ("Paralelo :" y "B"): el fragmento más cercano a
 * la derecha en el mismo renglón. En el PDF real vienen pegados; esto es por si no.
 */
const valueRightOf = (items: TextItem[], label: TextItem): string | null => {
  const right = items
    .filter(
      (it) =>
        it !== label &&
        Math.abs(it.y - label.y) <= LINE_TOLERANCE &&
        it.x >= label.x + label.width - 1
    )
    .sort((a, b) => a.x - b.x)[0]
  return right ? right.str.trim() : null
}

/**
 * El grado del catálogo para un nivel y un año de escolaridad: Inicial es un solo grado, y en
 * Primaria el año es el grado. Null para un nivel que el catálogo no tiene (Secundaria).
 */
const gradeFor = (level: string | null, schooling: number | null) => {
  if (level === "inicial") return "Inicial"
  if (level === "primaria" && schooling !== null) {
    return normalizeGradeName(String(schooling))
  }
  return null
}

/** Es la lista de toda la unidad si la página trae la etiqueta "Año de Escolaridad :". */
export const isSchoolRosterPage = (items: TextItem[]): boolean =>
  items.some((it) => SCHOOLING_RE.test(fold(it.str)))

/**
 * Los cursos de la lista del SIE de toda la unidad, cada uno con sus estudiantes.
 *
 * Cada curso abre con su nivel, su "Año de Escolaridad" y su "Paralelo", y la página siguiente los
 * repite si el curso sigue: se agrupa por curso, no por página. Los bloques se cortan por la altura
 * de la etiqueta del paralelo y no por renglones de texto, porque la segunda línea de un lugar de
 * nacimiento largo cae a la misma altura que la etiqueta del curso siguiente. La numeración del PDF
 * corre por toda la unidad; aquí cada curso numera desde 1, igual que la planilla.
 */
export const schoolRosterFromPages = (pages: TextItem[][]): SchoolRoster => {
  const blocks: SchoolRosterBlock[] = []
  let year: number | null = null
  let level: string | null = null
  let schooling: number | null = null
  // Un curso que sigue en la página siguiente recibe sus filas aunque falte el encabezado repetido.
  let current: SchoolRosterBlock | null = null

  const blockFor = (parallel: string | null): SchoolRosterBlock | null => {
    const grade = gradeFor(level, schooling)
    if (!grade || !parallel) return null
    const found = blocks.find(
      (b) => b.grade === grade && b.parallel === parallel
    )
    if (found) return found
    const block: SchoolRosterBlock = { grade, parallel, rows: [] }
    blocks.push(block)
    return block
  }

  const addRows = (block: SchoolRosterBlock | null, items: TextItem[]) => {
    if (block)
      block.rows.push(...studentRowsFromItems(items, block.rows.length))
  }

  for (const items of pages) {
    year ??= rosterYearFromItems(items)

    const headings = items
      .map(headingOf)
      .filter((h): h is Heading => h !== null)
      .sort((a, b) => b.item.y - a.item.y)
    const headingItems = new Set(headings.map((h) => h.item))
    const content = items.filter((it) => !headingItems.has(it))

    // Lo que hay sobre la primera etiqueta de paralelo sigue al curso de la página anterior.
    let top = Number.POSITIVE_INFINITY
    for (const heading of headings) {
      if (heading.kind === "level") {
        level = heading.level
      } else if (heading.kind === "schooling") {
        const raw = heading.value ?? valueRightOf(content, heading.item)
        schooling =
          raw !== null && /^\d+$/.test(String(raw)) ? Number(raw) : null
      } else if (heading.kind === "parallel") {
        const bottom = heading.item.y - LINE_TOLERANCE
        addRows(
          current,
          content.filter((it) => it.y < top && it.y >= bottom)
        )
        const raw = heading.value ?? valueRightOf(content, heading.item)
        current = blockFor(
          raw && /^[A-Za-z]$/.test(raw) ? raw.toUpperCase() : null
        )
        top = bottom
      }
    }
    addRows(
      current,
      content.filter((it) => it.y < top)
    )
  }

  return { year, blocks }
}

const describeBlock = (b: { grade: string; parallel: string }) =>
  `${b.grade} ${b.parallel}`

/**
 * El bloque del curso destino, o por qué no se puede importar.
 *
 * Como la planilla, elige el curso por grado y paralelo; como la nómina de un curso, exige que la
 * gestión del documento sea la del curso.
 */
export const schoolRosterBlockFor = (
  roster: SchoolRoster,
  course: RosterTargetCourse
): { block: SchoolRosterBlock } | { error: string } => {
  if (roster.blocks.length === 0) {
    return {
      error:
        "No se encontró ningún curso en la nómina del SIE. Verifica que sea la lista de estudiantes inscritos de la unidad educativa.",
    }
  }
  const grade = nominaGrade(course.gradeName) ?? course.gradeName.trim()
  const parallel = course.parallelName.trim().toUpperCase()

  const block = roster.blocks.find(
    (b) => b.grade === grade && b.parallel === parallel
  )
  if (!block) {
    return {
      error: `La nómina del SIE no tiene el curso ${describeBlock({
        grade,
        parallel,
      })}. Cursos encontrados: ${roster.blocks.map(describeBlock).join(", ")}.`,
    }
  }
  if (roster.year === null) {
    return {
      error:
        "No se pudo leer la gestión de la nómina; verifica que sea la nómina oficial.",
    }
  }
  const yearError = rosterHeaderMismatch(
    { grade, parallel, year: roster.year },
    { gradeName: grade, parallelName: parallel, year: course.year }
  )
  if (yearError) return { error: yearError }
  if (block.rows.length === 0) {
    return {
      error: `El curso ${describeBlock(block)} de la nómina no trae estudiantes.`,
    }
  }
  return { block }
}
