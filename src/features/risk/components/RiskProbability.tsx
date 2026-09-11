import { Loader2Icon } from "lucide-react"

import { cn } from "@/lib/utils"

import type { StudentRisk } from "../types/risk"
import {
  RISK_TEXT_CLASS,
  formatProbability,
  riskLevelLabel,
  riskLevelTone,
} from "../utils/riskLevel"

export interface RiskProbabilityProps {
  /** Absent where the model did not predict this student — the normal case early in a trimester. */
  risk: StudentRisk | undefined
  isLoading?: boolean
}

/**
 * One student's probability of failing, for a cell inside a table about something else.
 *
 * The category travels in the tooltip rather than beside the number: the score sheet has one
 * narrow column to spare, and a percentage nobody can read against a category is just a number.
 */
export function RiskProbability({ risk, isLoading }: RiskProbabilityProps) {
  if (isLoading) {
    return (
      <span role="status" aria-label="Cargando la predicción">
        <Loader2Icon className="mx-auto size-4 animate-spin text-muted-foreground" />
      </span>
    )
  }

  // A dash, not a blank: an empty cell reads as a zero probability, which is the opposite of
  // "the model has not seen enough of this student to say".
  if (!risk) {
    return <span className="text-muted-foreground">—</span>
  }

  const label = riskLevelLabel(risk.riskLevel)

  return (
    <span
      className={cn(RISK_TEXT_CLASS[riskLevelTone(risk.riskLevel)])}
      title={`${label} · probabilidad de reprobar la materia`}
    >
      {formatProbability(risk.pFail)}
    </span>
  )
}
