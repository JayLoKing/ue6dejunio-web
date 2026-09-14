import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import type { InstitutionRiskEntry } from "../types/risk"
import {
  RISK_TEXT_CLASS,
  formatProbability,
  riskLevelLabel,
  riskLevelTone,
  type RiskTone,
} from "../utils/riskLevel"

const BADGE_VARIANT: Record<RiskTone, "destructive" | "secondary" | "outline"> =
  {
    critical: "destructive",
    warning: "secondary",
    neutral: "outline",
    positive: "outline",
  }

export interface InstitutionRiskTableProps {
  rows: InstitutionRiskEntry[]
}

/**
 * The students of the whole school closest to failing, worst first.
 *
 * Read-only, and that is the design rather than a gap. Dirección reads every course and teaches
 * none of them, and the API guards the attend write through the prediction's own subject — an
 * offered button that always answers 403 is worse than no button at all.
 *
 * The rows are drawn in the order they arrived. Unlike the course panel this table never merges
 * two listings, so there is nothing to re-sort; and the places came numbered from the API, so
 * sorting again here could put a row numbered 2 above one numbered 1.
 */
export function InstitutionRiskTable({ rows }: InstitutionRiskTableProps) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12 text-right">#</TableHead>
            <TableHead>Estudiante</TableHead>
            <TableHead>Curso</TableHead>
            <TableHead>Materia</TableHead>
            <TableHead>Categoría</TableHead>
            <TableHead className="text-right">Prob. de reprobar</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-muted-foreground">
                Sin predicciones para este trimestre.
              </TableCell>
            </TableRow>
          ) : (
            rows.map((entry) => {
              const tone = riskLevelTone(entry.riskLevel)

              return (
                <TableRow key={entry.predictionId}>
                  <TableCell className="text-right text-muted-foreground tabular-nums">
                    {entry.position}
                  </TableCell>
                  <TableCell className="font-medium">{entry.fullName}</TableCell>
                  <TableCell>
                    {entry.gradeName} {entry.parallelName}
                  </TableCell>
                  <TableCell>{entry.subjectName}</TableCell>
                  <TableCell>
                    <Badge variant={BADGE_VARIANT[tone]}>
                      {riskLevelLabel(entry.riskLevel)}
                    </Badge>
                  </TableCell>
                  <TableCell className={cn("text-right", RISK_TEXT_CLASS[tone])}>
                    {formatProbability(entry.pFail)}
                  </TableCell>
                </TableRow>
              )
            })
          )}
        </TableBody>
      </Table>
    </div>
  )
}
