// Escala cualitativa / situacion MINEDU (valores POR CONFIRMAR con el docente).
// Centralizado aqui para reusar en notebook, centralizador y reportes.

export const PASSING_THRESHOLD = 51

export type Situacion = "APROBADO" | "REPROBADO"

export const situacionOf = (total: number): Situacion =>
  total >= PASSING_THRESHOLD ? "APROBADO" : "REPROBADO"

export interface CualitativoBand {
  code: string
  label: string
  min: number
}

// Bandas por defecto (ajustar cuando el docente confirme rangos).
export const CUALITATIVO_BANDS: CualitativoBand[] = [
  { code: "DP", label: "Desarrollo Pleno", min: 90 },
  { code: "DO", label: "Desarrollo Optimo", min: 75 },
  { code: "DA", label: "Desarrollo Aceptable", min: 51 },
  { code: "ED", label: "En Desarrollo", min: 0 },
]

export const cualitativoOf = (total: number): CualitativoBand =>
  CUALITATIVO_BANDS.find((b) => total >= b.min) ?? CUALITATIVO_BANDS[CUALITATIVO_BANDS.length - 1]

export const situacionClass = (s: Situacion): string =>
  s === "APROBADO"
    ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30"
    : "bg-destructive/15 text-destructive border border-destructive/30"
