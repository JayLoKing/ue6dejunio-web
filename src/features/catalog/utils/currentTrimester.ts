import type { TrimesterItem } from "../types"

const pad = (n: number) => String(n).padStart(2, "0")

/**
 * El trimestre en curso según el calendario del catálogo: el que contiene hoy, ambos extremos
 * incluidos. En un receso entre trimestres, o pasado el último, queda el último que ya empezó;
 * antes del primero, o sin calendario cargado, el 1.
 *
 * "Hoy" se arma con los campos locales de la fecha y se compara como `YYYY-MM-DD`: un
 * `new Date("2026-05-11")` es medianoche UTC, que en Bolivia todavía es el día anterior.
 */
export function currentTrimester(
  trimesters: readonly TrimesterItem[] | undefined,
  today: Date = new Date()
): number {
  const iso = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`
  let current: TrimesterItem | undefined
  for (const t of trimesters ?? []) {
    if (t.startDate <= iso && (!current || t.startDate > current.startDate)) {
      current = t
    }
  }
  return current?.trimester ?? 1
}
