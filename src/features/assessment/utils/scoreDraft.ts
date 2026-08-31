/**
 * Reglas de la casilla de nota, compartidas por las dos grillas del cuaderno.
 *
 * El borrador guarda SOLO lo tecleado: una casilla que nadie tocó no tiene entrada y se
 * dibuja leyendo la nota guardada. Espejar el servidor al borrador en un efecto deja que
 * un refetch pise lo que el docente está escribiendo, y es justo el bug que esto evita.
 */

/** Lo tecleado si la casilla se tocó; si no, la nota guardada. "" = no calificado. */
export function draftText(
  draft: Record<string, string>,
  key: string,
  saved: number | undefined
): string {
  const typed = draft[key]
  // Vaciar la casilla es intencional: "" no cae de vuelta a la nota guardada.
  if (typed !== undefined) return typed
  return saved === undefined ? "" : String(saved)
}

/** Acota la nota al rango de su dimensión. */
export function clampScore(value: number, max: number): number {
  if (value < 0) return 0
  if (value > max) return max
  return value
}

/**
 * Nota de una casilla a partir de su texto. `null` = no calificada, que no es lo mismo
 * que un 0. El tope se aplica acá y no solo al guardar: el promedio se calcula mientras
 * el docente escribe, y sin esto un 999 sin confirmar inflaba el promedio y el total.
 */
export function scoreFromText(raw: string, max: number): number | null {
  const trimmed = raw.trim()
  if (trimmed === "") return null
  const parsed = Number(trimmed)
  // Texto que no es un número no vale 0: vale nada.
  if (!Number.isFinite(parsed)) return null
  return clampScore(parsed, max)
}

/** Media de las notas presentes. `null` si no hay ninguna. */
export function mean(values: number[]): number | null {
  if (values.length === 0) return null
  return values.reduce((a, b) => a + b, 0) / values.length
}
