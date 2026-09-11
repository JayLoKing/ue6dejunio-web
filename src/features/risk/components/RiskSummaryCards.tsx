import { useMemo } from "react"

import { cn } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"

import type { RiskLevel, StudentRisk } from "../types/risk"
import { riskLevelLabel, summarizeRisk } from "../utils/riskLevel"

interface CardSpec {
  level: RiskLevel
  count: number
  /** Only the critical card carries one: the others are head counts, not work. */
  note?: string
  className: string
}

export interface RiskSummaryCardsProps {
  rows: StudentRisk[]
}

/** The head count behind a listing, so the panel answers "how bad is it" before it is read. */
export function RiskSummaryCards({ rows }: RiskSummaryCardsProps) {
  const cards = useMemo<CardSpec[]>(() => {
    const summary = summarizeRisk(rows)
    return [
      {
        level: "RiesgoCritico",
        count: summary.critical,
        // Said against the total because "3 atendidos" means nothing without "de 5".
        note: `${summary.attended} de ${summary.critical} atendidos`,
        className: "text-rose-600 dark:text-rose-400",
      },
      {
        level: "EnRiesgo",
        count: summary.warning,
        className: "text-amber-600 dark:text-amber-400",
      },
      {
        level: "SinRiesgo",
        count: summary.none,
        className: "text-foreground",
      },
      {
        level: "Sobresaliente",
        count: summary.outstanding,
        className: "text-emerald-600 dark:text-emerald-400",
      },
    ]
  }, [rows])

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {cards.map((card) => {
        const label = riskLevelLabel(card.level)
        return (
          <Card key={card.level} role="group" aria-label={label}>
            <CardContent className="flex flex-col gap-1 p-4">
              <span className="text-xs font-medium text-muted-foreground uppercase">
                {label}
              </span>
              <span className={cn("text-2xl font-bold", card.className)}>
                {card.count}
              </span>
              {card.note ? (
                <span className="text-xs text-muted-foreground">
                  {card.note}
                </span>
              ) : null}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
