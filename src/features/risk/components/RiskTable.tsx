import { useMemo } from "react"
import { CheckCircle2Icon, CircleDashedIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import type { RiskLevel, StudentRisk } from "../types/risk"
import {
  RISK_TEXT_CLASS,
  formatProbability,
  riskLevelLabel,
  riskLevelSeverity,
  riskLevelTone,
  type RiskTone,
} from "../utils/riskLevel"

/** Only the failing category is worth interrupting a teacher over — and so worth acting on. */
const ACTIONABLE: RiskLevel = "RiesgoCritico"

const BADGE_VARIANT: Record<RiskTone, "destructive" | "secondary" | "outline"> =
  {
    critical: "destructive",
    warning: "secondary",
    neutral: "outline",
    positive: "outline",
  }

export interface RiskTableProps {
  rows: StudentRisk[]
  /** Drop the subject column where every row is the same subject and repeating it says nothing. */
  hideSubject?: boolean
  /**
   * Records that somebody acted on a prediction. Absent, the table is read-only — which is what
   * a listing spanning subjects the reader does not teach has to be, because the API refuses the
   * write anyway and an offered button that always fails is worse than no button.
   */
  onToggleAttended?: (risk: StudentRisk, attended: boolean) => void
  /**
   * Which rows the reader may act on, where that differs row by row.
   *
   * A course listing spans every subject in it and a homeroom teacher does not necessarily take
   * the technical ones, so ownership is a property of the row and not of the table. Omitted, every
   * row the model is calling for is actionable.
   */
  canAttend?: (risk: StudentRisk) => boolean
  /** Disables the actions while a write is in flight, without emptying the table. */
  isBusy?: boolean
}

export function RiskTable({
  rows,
  hideSubject,
  onToggleAttended,
  canAttend,
  isBusy,
}: RiskTableProps) {
  // The API already answers worst first. Sorted again here because the panel merges listings from
  // several subjects into one table, and two sorted lists concatenated are not a sorted list.
  const sorted = useMemo(
    () =>
      [...rows].sort(
        (a, b) =>
          riskLevelSeverity(a.riskLevel) - riskLevelSeverity(b.riskLevel) ||
          b.pFail - a.pFail ||
          a.studentName.localeCompare(b.studentName)
      ),
    [rows]
  )

  const columnCount = hideSubject ? 4 : 5

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Estudiante</TableHead>
            {hideSubject ? null : <TableHead>Materia</TableHead>}
            <TableHead>Categoría</TableHead>
            <TableHead className="text-right">Prob. de reprobar</TableHead>
            <TableHead className="w-10" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {sorted.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={columnCount}
                className="text-center text-muted-foreground"
              >
                Sin predicciones para este trimestre.
              </TableCell>
            </TableRow>
          ) : (
            sorted.map((risk) => {
              const tone = riskLevelTone(risk.riskLevel)
              const actionable =
                onToggleAttended &&
                risk.riskLevel === ACTIONABLE &&
                (canAttend?.(risk) ?? true)

              return (
                <TableRow key={risk.id}>
                  <TableCell className="font-medium">
                    {risk.studentName}
                  </TableCell>
                  {hideSubject ? null : (
                    <TableCell>{risk.subjectName}</TableCell>
                  )}
                  <TableCell>
                    <Badge variant={BADGE_VARIANT[tone]}>
                      {riskLevelLabel(risk.riskLevel)}
                    </Badge>
                  </TableCell>
                  <TableCell
                    className={cn("text-right", RISK_TEXT_CLASS[tone])}
                  >
                    {formatProbability(risk.pFail)}
                  </TableCell>
                  <TableCell className="text-right">
                    {actionable ? (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="size-8"
                        disabled={isBusy}
                        title={
                          risk.attended
                            ? "Marcar como pendiente"
                            : "Marcar como atendida"
                        }
                        onClick={() => onToggleAttended(risk, !risk.attended)}
                      >
                        {risk.attended ? (
                          <CheckCircle2Icon className="size-4 text-success" />
                        ) : (
                          <CircleDashedIcon className="size-4 text-muted-foreground" />
                        )}
                        <span className="sr-only">
                          {risk.attended
                            ? `Marcar como pendiente la predicción de ${risk.studentName}`
                            : `Marcar como atendida la predicción de ${risk.studentName}`}
                        </span>
                      </Button>
                    ) : null}
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
