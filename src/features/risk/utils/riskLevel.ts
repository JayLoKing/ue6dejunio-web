import { RISK_LEVELS, type StudentRisk } from "../types/risk"

export { RISK_LEVELS }

/** How loud a category is allowed to be on screen. */
export type RiskTone = "critical" | "warning" | "neutral" | "positive"

const LABELS: Record<string, string> = {
  RiesgoCritico: "Riesgo crítico",
  EnRiesgo: "En riesgo",
  SinRiesgo: "Sin riesgo",
  Sobresaliente: "Sobresaliente",
}

/**
 * Only the failing category is loud. `EnRiesgo` is the largest group in the training data, so
 * painting it red would paint most of the school red, and a colour that means "most students"
 * means nothing on the day the real one appears.
 */
const TONES: Record<string, RiskTone> = {
  RiesgoCritico: "critical",
  EnRiesgo: "warning",
  SinRiesgo: "neutral",
  Sobresaliente: "positive",
}

/**
 * The category in the school's own words.
 *
 * A category this build was never taught comes back verbatim rather than blank: the raw name is
 * little use to a teacher, but it is true, and it says out loud that the web is behind the model.
 */
export function riskLevelLabel(level: string): string {
  return LABELS[level] ?? level
}

export function riskLevelTone(level: string): RiskTone {
  return TONES[level] ?? "neutral"
}

/**
 * Rank for sorting, worst first.
 *
 * The API already answers its listings in this order. This exists because the panel merges several
 * subjects into one table and lets the reader re-sort it, and these four words do not sort into
 * severity alphabetically. An unknown category ranks last: it is not evidence of danger.
 */
export function riskLevelSeverity(level: string): number {
  const rank = RISK_LEVELS.indexOf(level as (typeof RISK_LEVELS)[number])
  return rank === -1 ? RISK_LEVELS.length : rank
}

/**
 * How a probability is painted for each tone.
 *
 * Here rather than in each table so the same number is the same colour wherever it is read: the
 * panel and the score sheet show the one figure, and two maps would drift into two vocabularies.
 */
export const RISK_TEXT_CLASS: Record<RiskTone, string> = {
  critical: "font-bold text-rose-600 dark:text-rose-400",
  warning: "font-semibold text-amber-600 dark:text-amber-400",
  neutral: "text-muted-foreground",
  positive: "text-muted-foreground",
}

/** The stored fraction as the percentage a teacher reads. */
export function formatProbability(pFail: number): string {
  return `${(pFail * 100).toFixed(1)}%`
}

export interface RiskSummary {
  total: number
  critical: number
  warning: number
  none: number
  outstanding: number
  /** How many of the critical ones somebody already acted on. */
  attended: number
}

/**
 * The head count behind a listing.
 *
 * `attended` counts only the critical ones. A student the model cleared was never anybody's
 * pending task, so counting them as handled would report work that never existed.
 */
export function summarizeRisk(risks: StudentRisk[]): RiskSummary {
  const summary: RiskSummary = {
    total: risks.length,
    critical: 0,
    warning: 0,
    none: 0,
    outstanding: 0,
    attended: 0,
  }

  for (const risk of risks) {
    switch (risk.riskLevel) {
      case "RiesgoCritico":
        summary.critical += 1
        if (risk.attended) summary.attended += 1
        break
      case "EnRiesgo":
        summary.warning += 1
        break
      case "SinRiesgo":
        summary.none += 1
        break
      case "Sobresaliente":
        summary.outstanding += 1
        break
    }
  }

  return summary
}
