import type { AnnualSubjectTotal } from "../types"

/**
 * Una nota que la escuela nunca escribió se muestra como guion, jamás como cero. Un área que
 * arranca a mitad de año no tiene nota en los trimestres anteriores a su existencia, y un 0 ahí
 * se leería como un estudiante que reprobó una materia que nunca tuvo.
 *
 * Dos decimales siempre: redondear a entero mostraría 50.6 como 51, que es justo la nota de
 * aprobación, y la hoja diría aprobado donde el dato dice reprobado.
 */
export function formatMark(
  mark: number | null | undefined,
  fractionDigits = 2
): string {
  return mark == null ? "—" : Number(mark).toFixed(fractionDigits)
}

/** Las tres notas trimestrales de un área en el orden de la hoja, con los nulos intactos. */
export function trimesterMarksOf(
  subject: AnnualSubjectTotal | undefined
): (number | null)[] {
  if (!subject) {
    return [null, null, null]
  }
  return [subject.trimester1, subject.trimester2, subject.trimester3]
}

/**
 * Mejor promedio anual primero, que es lo que pide la hoja "DE MAYOR A MENOR" de la escuela.
 *
 * El estudiante sin nada calificado se va al fondo en vez de ordenar como cero: no es el peor del
 * curso, es uno al que el año todavía no juzgó.
 */
export function rankedByFinalAverage<T extends { finalAverage: number | null }>(
  rows: T[]
): T[] {
  return [...rows].sort((a, b) => {
    if (a.finalAverage == null && b.finalAverage == null) return 0
    if (a.finalAverage == null) return 1
    if (b.finalAverage == null) return -1
    return Number(b.finalAverage) - Number(a.finalAverage)
  })
}
