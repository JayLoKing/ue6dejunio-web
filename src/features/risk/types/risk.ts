/**
 * The four categories the model was trained on, spelled the way it spells them.
 *
 * Not translated at the boundary. The API keeps the model's vocabulary on purpose so these four
 * words live in one place; translating them here would put them back in two, and a model retrained
 * with a fifth category would fall silently through the mapping instead of showing up unknown.
 *
 * Declared worst first, matching the enum on the API side.
 */
export const RISK_LEVELS = [
  "RiesgoCritico",
  "EnRiesgo",
  "SinRiesgo",
  "Sobresaliente",
] as const

export type RiskLevel = (typeof RISK_LEVELS)[number]

/**
 * One standing prediction, carrying the two names that make it readable.
 *
 * `riskLevel` is typed loosely on purpose: the API can answer a category this build has not been
 * taught, and a narrow type would make that a parse error rather than a row that says so.
 *
 * @see StudentRiskResponse on the API side
 */
export interface StudentRisk {
  id: string
  studentId: string
  studentName: string
  classGroupId: string
  subjectName: string
  trimester: number
  riskLevel: RiskLevel | (string & {})
  /** Probability of failing the subject, stored 0 to 1. */
  pFail: number
  pOutstanding: number
  attended: boolean
  predictedAt: string
}

/**
 * What a write answers with. No names: whoever marked the prediction had it on screen already.
 *
 * @see RiskPredictionResponse on the API side
 */
export interface RiskPrediction {
  id: string
  studentId: string
  classGroupId: string
  trimester: number
  riskLevel: RiskLevel | (string & {})
  pFail: number
  pOutstanding: number
  attended: boolean
  predictedAt: string
}

/**
 * What a run did, so the caller can tell "nothing to predict" from "nothing happened".
 *
 * @see RiskRunResponse on the API side
 */
export interface RunSummary {
  considered: number
  /** Students missing a mark in at least one dimension. Normal early in a trimester, not a failure. */
  skipped: number
  predicted: number
  changed: number
}
