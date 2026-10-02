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

/** El año está cerrado cuando alguna fila viene congelada (la API marca todas las de un año cerrado). */
export function hasFrozenRows(
  rows: ReadonlyArray<{ frozen: boolean }>
): boolean {
  return rows.some((row) => row.frozen)
}
