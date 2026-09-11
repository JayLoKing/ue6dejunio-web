import { useMemo } from "react"
import { BrainCircuitIcon, Loader2Icon } from "lucide-react"

import { Button } from "@/components/ui/button"

import {
  useClassGroupRisk,
  useMarkRiskAttended,
  usePredictClassGroupRisk,
} from "../hooks/useRisk"
import { RiskSummaryCards } from "./RiskSummaryCards"
import { RiskTable } from "./RiskTable"

export interface ClassGroupRiskPanelProps {
  classGroupId: string | null
  trimester: number
}

/**
 * One subject: the teacher's own view, and the only place the model is run by hand per subject.
 *
 * Always writable, and no flag to make it otherwise. The only caller lets a teacher choose among
 * the subjects they teach, so the API grants both the run and the attend on every one of them — a
 * read-only mode here would be a branch nothing can reach. A reader who does not own the subject
 * reads the course listing instead, which is read-only by construction.
 */
export function ClassGroupRiskPanel({
  classGroupId,
  trimester,
}: ClassGroupRiskPanelProps) {
  const risks = useClassGroupRisk(classGroupId, trimester)
  const predict = usePredictClassGroupRisk()
  const attend = useMarkRiskAttended()

  // Stable across renders: see the equivalent comment in CourseRiskPanel.
  const rows = useMemo(() => risks.data ?? [], [risks.data])

  if (!classGroupId) {
    return (
      <p className="text-sm text-muted-foreground">
        Selecciona una materia para ver sus predicciones.
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          disabled={predict.isPending}
          onClick={() => predict.mutate({ classGroupId, trimester })}
        >
          {predict.isPending ? (
            <Loader2Icon className="size-4 animate-spin" />
          ) : (
            <BrainCircuitIcon className="size-4 text-primary" />
          )}
          Ejecutar modelo
        </Button>
      </div>

      {risks.isLoading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2Icon className="size-4 animate-spin" />
          Cargando predicciones...
        </div>
      ) : (
        <>
          <RiskSummaryCards rows={rows} />
          <RiskTable
            rows={rows}
            hideSubject
            isBusy={attend.isPending}
            onToggleAttended={(risk, attended) =>
              attend.mutate({ id: risk.id, attended })
            }
          />
        </>
      )}
    </div>
  )
}
