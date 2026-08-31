// Escala cualitativa / situación MINEDU (valores POR CONFIRMAR con el docente).
// Centralizado aquí para reusar en notebook, centralizador y reportes.

export const PASSING_THRESHOLD = 51

/** Si el estudiante aprobó. Los valores son las palabras del MINEDU, por eso van en español. */
export type AcademicStatus = "APROBADO" | "REPROBADO"

export const statusOf = (total: number): AcademicStatus =>
  total >= PASSING_THRESHOLD ? "APROBADO" : "REPROBADO"

export interface QualitativeBand {
  code: string
  label: string
  min: number
}

// Bandas por defecto (ajustar cuando el docente confirme rangos).
export const QUALITATIVE_BANDS: QualitativeBand[] = [
  { code: "DP", label: "Desarrollo Pleno", min: 90 },
  { code: "DO", label: "Desarrollo Óptimo", min: 75 },
  { code: "DA", label: "Desarrollo Aceptable", min: 51 },
  { code: "ED", label: "En Desarrollo", min: 0 },
]

export const qualitativeBandOf = (total: number): QualitativeBand =>
  QUALITATIVE_BANDS.find((b) => total >= b.min) ??
  QUALITATIVE_BANDS[QUALITATIVE_BANDS.length - 1]

export const statusClassName = (s: AcademicStatus): string =>
  s === "APROBADO"
    ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30"
    : "bg-destructive/15 text-destructive border border-destructive/30"
