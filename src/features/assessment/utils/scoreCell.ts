/** Presentación de la casilla de nota, compartida por las dos grillas del cuaderno. */

/** Lo que la casilla necesita saber de una nota para armar su tooltip. */
export interface DatedCell {
  recordedAt: string | null
  updatedAt: string | null
}

/** Una décima: los promedios se muestran redondeados, la nota se guarda como se tecleó. */
export const round1 = (n: number): number => Math.round(n * 10) / 10

const formatDate = (iso: string | null | undefined): string | null => {
  if (!iso) return null
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? null : d.toLocaleDateString("es-BO")
}

/** Tooltip de la casilla: fecha de registro, y la de edición solo si es otro día. */
export function cellTitle(cell: DatedCell | undefined): string | undefined {
  if (!cell) return undefined
  const recorded = formatDate(cell.recordedAt)
  const updated = formatDate(cell.updatedAt)
  if (!recorded && !updated) return undefined
  const parts: string[] = []
  if (recorded) parts.push(`registrada ${recorded}`)
  if (updated && updated !== recorded) parts.push(`editada ${updated}`)
  return parts.join(" · ")
}
