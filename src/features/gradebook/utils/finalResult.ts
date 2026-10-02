import { annualStatusOf, type AcademicStatus } from "@/lib/grading"

import type { FinalResult, StudentAnnualSummary } from "../types"

/**
 * El resultado final del año tal como lo imprime la escuela. Es el único lugar donde se traduce
 * el código de la API: la pantalla y el documento exportado leen de acá para no poder discrepar.
 *
 * Null no es reprobado: en un año cerrado significa retirado o sin notas, y no se escribe nada.
 */
export function finalResultLabel(
  result: FinalResult | null
): AcademicStatus | null {
  if (result === "APPROVED") return "APROBADO"
  if (result === "FAILED") return "REPROBADO"
  return null
}

export type AnnualSituationInput = Pick<
  StudentAnnualSummary,
  "finalAverage" | "finalResult" | "frozen"
>

/**
 * La situación final del año de un estudiante, para la pantalla y el documento. Un año cerrado
 * manda con lo congelado (null si no hay resultado: retirado o sin notas); uno abierto sigue la
 * regla anual sobre el promedio, y sin promedio no hay situación.
 */
export function annualSituationOf(
  row: AnnualSituationInput
): AcademicStatus | null {
  if (row.frozen) return finalResultLabel(row.finalResult)
  return row.finalAverage == null
    ? null
    : annualStatusOf(Number(row.finalAverage))
}

/** El resultado a imprimir en la libreta: sólo con el año cerrado, y nada si no hay resultado. */
export function frozenResultLabel(card: {
  frozen: boolean
  finalResult: FinalResult | null
}): string | null {
  return card.frozen ? finalResultLabel(card.finalResult) : null
}
