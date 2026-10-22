/** Como los tableros nombran cada trimestre en los títulos de las tarjetas. */
export const ORDINAL: Record<number, string> = { 1: "1er", 2: "2do", 3: "3er" }

/**
 * Los tramos del histograma de notas.
 *
 * Los cortes no son decorativos: 51 es el umbral de aprobación de la escuela, así que el primer
 * tramo es exactamente "reprobados". Los otros dos parten lo aprobado en el que pasó raspando y el
 * que está cómodo, que es la distinción que un docente necesita para saber a quién sostener.
 */
export const BANDS = [
  { name: "0–50", from: 0, to: 50 },
  { name: "51–68", from: 51, to: 68 },
  { name: "69–84", from: 69, to: 84 },
  { name: "85–100", from: 85, to: 100 },
]

/** La media a un decimal, o null si no hay nada que promediar: sin notas no es un cero. */
export function meanOf(values: number[]): number | null {
  if (values.length === 0) return null
  return Number((values.reduce((a, b) => a + b, 0) / values.length).toFixed(1))
}
