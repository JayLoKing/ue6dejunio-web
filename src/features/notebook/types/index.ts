export const DIMENSION_WEIGHTS = {
  SER: 10,
  SABER: 45,
  HACER: 40,
  AUTO: 5,
} as const

export type Trimester = 1 | 2 | 3

export type RiskLevel =
  | "SOBRESALIENTE"
  | "SIN_RIESGO"
  | "EN_RIESGO"
  | "RIESGO_CRITICO"

export interface RiskMeta {
  label: string
  badgeCls: string
  dotCls: string
}

export const RISK_META: Record<RiskLevel, RiskMeta> = {
  SOBRESALIENTE: {
    label: "Sobresaliente",
    badgeCls:
      "bg-univalle/15 text-univalle border border-univalle/30",
    dotCls: "bg-univalle",
  },
  SIN_RIESGO: {
    label: "Sin riesgo",
    badgeCls:
      "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30",
    dotCls: "bg-emerald-500",
  },
  EN_RIESGO: {
    label: "En riesgo",
    badgeCls:
      "bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30",
    dotCls: "bg-amber-500",
  },
  RIESGO_CRITICO: {
    label: "Riesgo critico",
    badgeCls: "bg-destructive/15 text-destructive border border-destructive/30",
    dotCls: "bg-destructive",
  },
}

export interface SubjectArea {
  id: string
  name: string
  shortName: string
}

export interface StudentScoreRow {
  enrollmentId: string
  studentId: string
  fullName: string
  rudeCode: string
}

export interface ScoreDraft {
  ser: number
  saber: number
  hacer: number
  auto: number
}

export const totalFromDraft = (d: ScoreDraft): number =>
  Number((d.ser + d.saber + d.hacer + d.auto).toFixed(2))

export const classifyRisk = (total: number): RiskLevel => {
  if (total >= 90) return "SOBRESALIENTE"
  if (total >= 70) return "SIN_RIESGO"
  if (total >= 51) return "EN_RIESGO"
  return "RIESGO_CRITICO"
}
