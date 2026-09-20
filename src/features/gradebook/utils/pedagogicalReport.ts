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
