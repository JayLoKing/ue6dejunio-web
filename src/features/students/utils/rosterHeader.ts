import type { RosterHeader } from "../types"
import type { TextItem } from "./pdfParser"

/** Lo justo del curso destino para compararlo con la cabecera. */
export interface RosterTargetCourse {
  gradeName: string
  parallelName: string
  year: number
}

/** Los grados tal como los nombra el catálogo (`grades.name`), en orden. */
const GRADE_NAMES = [
  "Primero",
  "Segundo",
  "Tercero",
  "Cuarto",
  "Quinto",
  "Sexto",
] as const

/** Cada forma de escribir un grado, ya sin tildes y en minúsculas, apuntando a su posición. */
const GRADE_WORDS: Record<string, number> = {
  primero: 0,
  primer: 0,
  segundo: 1,
  tercero: 2,
  tercer: 2,
  cuarto: 3,
  quinto: 4,
  sexto: 5,
}

const fold = (s: string): string =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim()

/**
 * El nombre de catálogo del grado escrito de cualquier forma: "PRIMERO", "1ro", "1er", "3°", "5" o
 * "Primero de Secundaria". Sólo mira la primera palabra; el nivel que venga detrás no cambia el
 * grado. Null si esa palabra no es un grado de primaria.
 */
export const normalizeGradeName = (raw: string): string | null => {
  const first = fold(raw).split(" ")[0] ?? ""
  if (first in GRADE_WORDS) return GRADE_NAMES[GRADE_WORDS[first]]
  const ordinal = first.match(/^(\d)(?:ro|er|ero|do|to|o|°|º)?\.?$/)
  if (!ordinal) return null
  return GRADE_NAMES[Number(ordinal[1]) - 1] ?? null
}

const normalizeParallel = (raw: string): string | null => {
  const letter = fold(raw).toUpperCase()
  return /^[A-Z]$/.test(letter) ? letter : null
}

const LINE_TOLERANCE = 3 // pt: el valor del paralelo cae un punto más arriba que su etiqueta

const isLabel = (it: TextItem): boolean => it.str.trim().endsWith(":")

/**
 * El valor de una etiqueta de la cabecera ("Grado:", "Paralelo:").
 *
 * En el formulario SIE la etiqueta y su valor son fragmentos separados en el mismo renglón; se toma
 * el más cercano a la derecha que no sea otra etiqueta. Si pdfjs los entrega juntos ("Grado:
 * Cuarto"), se usa lo que sigue a los dos puntos.
 */
const labelValue = (items: TextItem[], label: string): string | null => {
  const labelItem = items.find((it) =>
    new RegExp(`^${label}\\s*:`).test(fold(it.str))
  )
  if (!labelItem) return null

  const glued = labelItem.str.slice(labelItem.str.indexOf(":") + 1).trim()
  if (glued) return glued

  const right = items
    .filter(
      (it) =>
        it !== labelItem &&
        !isLabel(it) &&
        Math.abs(it.y - labelItem.y) <= LINE_TOLERANCE &&
        it.x >= labelItem.x + labelItem.width - 1
    )
    .sort((a, b) => a.x - b.x)[0]
  return right ? right.str.trim() : null
}

const YEAR_RE = /gestion\s*:?\s*-?\s*(\d{4})/

/**
 * El curso al que pertenece la nómina, leído de la cabecera de su primera página.
 *
 * Responde null si falta cualquiera de los tres datos o no se reconoce: sin cabecera no hay forma
 * de saber de qué curso es la lista, y la lista de toda la unidad (sin "Grado:") tampoco es una
 * nómina de curso.
 */
export const rosterHeaderFromItems = (
  items: TextItem[]
): RosterHeader | null => {
  const rawGrade = labelValue(items, "grado")
  const rawParallel = labelValue(items, "paralelo")
  const yearMatch = items
    .map((it) => fold(it.str).match(YEAR_RE))
    .find((m) => m !== null)

  const grade = rawGrade ? normalizeGradeName(rawGrade) : null
  const parallel = rawParallel ? normalizeParallel(rawParallel) : null
  if (!grade || !parallel || !yearMatch) return null

  return { grade, parallel, year: Number(yearMatch[1]) }
}

const describeCourse = (grade: string, parallel: string, year: number) =>
  `${grade} ${parallel} ${year}`

/**
 * Por qué no se puede importar la nómina en el curso destino, o null si es de ese curso.
 *
 * El grado del curso pasa por el mismo normalizador que el de la nómina, así un catálogo escrito en
 * mayúsculas o con otra grafía no rechaza la nómina correcta.
 */
export const rosterHeaderMismatch = (
  header: RosterHeader | null,
  course: RosterTargetCourse
): string | null => {
  if (!header) {
    return "No se pudo leer el curso y paralelo de la nómina; verifica que sea la nómina oficial."
  }
  const courseGrade =
    normalizeGradeName(course.gradeName) ?? course.gradeName.trim()
  const courseParallel =
    normalizeParallel(course.parallelName) ?? course.parallelName.trim()

  if (
    header.grade === courseGrade &&
    header.parallel === courseParallel &&
    header.year === course.year
  ) {
    return null
  }
  return `Esta nómina no corresponde a tu curso (${describeCourse(
    header.grade,
    header.parallel,
    header.year
  )} ≠ ${describeCourse(courseGrade, courseParallel, course.year)}).`
}
