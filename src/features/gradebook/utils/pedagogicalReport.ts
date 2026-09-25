import type { PedagogicalReport } from "../types"

/** "Primer", "Segundo", "Tercer" — cómo el formulario nombra el trimestre en su título. */
const ORDINAL: Record<number, string> = {
  1: "PRIMER",
  2: "SEGUNDO",
  3: "TERCER",
}

export function trimesterOrdinal(trimester: number): string {
  return ORDINAL[trimester] ?? String(trimester)
}

/**
 * La despedida con la que cierra el informe, antes de la firma.
 *
 * Venía copiada palabra por palabra del único ejemplar que dejó la escuela — "Este es lo que puedo
 * dar fe, con respecto a mis estudiantes..." — y ese ejemplar lo escribió la docente de Quinto "B".
 * No es la fórmula impresa del formulario, así que la falta de concordancia era de ella y no del
 * documento oficial: se corrige.
 *
 * Sigue siendo una sola para todos los cursos y trimestres, y eso es deliberado: es la despedida
 * del documento, no algo que cada docente redacte. Lo que cada una escribe son los logros, las
 * dificultades y las acciones, que sí son campos.
 *
 * Vive acá, y no en cada salida, porque el preview y el .docx imprimen el mismo papel. Escrita dos
 * veces, corregir una dejaba a la otra diciendo otra cosa sobre los mismos estudiantes.
 */
export const PEDAGOGICAL_REPORT_CLOSING =
  "De esto doy fe, con respecto a mis estudiantes, y saludo a usted con las consideraciones del caso."

/** El título que encabeza la hoja, con el trimestre en letras como lo escribe la escuela. */
export function pedagogicalReportTitle(
  sheet: Pick<PedagogicalReport, "trimester">
): string {
  return `INFORME PEDAGÓGICO DEL ${trimesterOrdinal(sheet.trimester)} TRIMESTRE`
}

/** El nombre con que el informe llega al disco, y el título de la ventana de impresión. */
export function pedagogicalReportLabel(
  sheet: Pick<
    PedagogicalReport,
    "gradeName" | "parallelName" | "year" | "trimester"
  >
): string {
  return `Informe pedagógico ${sheet.gradeName} ${sheet.parallelName} ${sheet.year} - Trimestre ${sheet.trimester}`
}

/**
 * Una nota reprobada, como la imprime la planilla.
 *
 * Con decimales y no redondeada a entero: 51 es el umbral de aprobación, así que un 50,6 impreso
 * como 51 quedaría leyéndose aprobado dentro del cuadro de los reprobados.
 */
export function fmtMark(mark: number): string {
  return mark.toLocaleString("es-BO", { maximumFractionDigits: 2 })
}

/** El porcentaje de la sección III. Sin nómina efectiva no hay porcentaje, y no es un cero. */
export function fmtPct(pct: number | null): string {
  return pct === null
    ? "—"
    : pct.toLocaleString("es-BO", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
}
