import { annualStatusOf, type AcademicStatus } from "@/lib/grading"

import type { FinalResult } from "../types"

/**
 * El resultado final del año tal como lo imprime la escuela. Es el único lugar donde se traduce
 * el código de la API: la pantalla y el documento exportado leen de acá para no poder discrepar.
 *
 * Null no es reprobado: en un año cerrado significa retirado o sin notas, y no se escribe nada.
 */
export function finalResultLabel(result: FinalResult | null): string | null {
  if (result === "APPROVED") return "APROBADO"
  if (result === "FAILED") return "REPROBADO"
  return null
}

/**
 * La situación final del año de un estudiante, para la pantalla y el documento. Un año cerrado
 * manda con lo congelado (null si no hay resultado: retirado o sin notas); uno abierto sigue la
 * regla anual sobre el promedio, y sin promedio no hay situación.
 */
export function annualSituationOf(row: {
  finalAverage: number | null
  finalResult: FinalResult | null
  frozen: boolean
}): AcademicStatus | null {
  if (row.frozen) {
    if (row.finalResult === "APPROVED") return "APROBADO"
    if (row.finalResult === "FAILED") return "REPROBADO"
    return null
  }
  return row.finalAverage == null
    ? null
    : annualStatusOf(Number(row.finalAverage))
}

/** El año está cerrado cuando alguna fila viene congelada (la API marca todas las de un año cerrado). */
export function hasFrozenRows(
  rows: ReadonlyArray<{ frozen: boolean }>
): boolean {
  return rows.some((row) => row.frozen)
}

/** El resultado a imprimir en la libreta: sólo con el año cerrado, y nada si no hay resultado. */
export function frozenResultLabel(card: {
  frozen: boolean
  finalResult: FinalResult | null
}): string | null {
  return card.frozen ? finalResultLabel(card.finalResult) : null
}
