import { useMemo } from "react"
import { Loader2Icon } from "lucide-react"

import { useCourseRisk, useMarkRiskAttended } from "../hooks/useRisk"
import { RiskSummaryCards } from "./RiskSummaryCards"
import { RiskTable } from "./RiskTable"

export interface CourseRiskPanelProps {
  courseId: string | null
  trimester: number
  /**
   * The subjects of this course the reader teaches, and therefore the rows they may act on.
   *
   * The API guards that write through the prediction's own subject. A homeroom teacher reads
   * all nine subjects of their course but does not necessarily take the technical ones, so
   * ownership is decided row by row rather than for the listing. Omitted, the panel is read-only —
   * which is what it is for Dirección, who reads the whole school and teaches none of it.
   */
  ownedClassGroupIds?: string[]
}

/**
 * Every subject of one course, in one listing.
 *
 * This is the Director's view and the homeroom teacher's alike: both read the same course
 * across its nine subjects, and the API answers both through `canReadCourseRoster`.
 */
export function CourseRiskPanel({
  courseId,
  trimester,
  ownedClassGroupIds,
}: CourseRiskPanelProps) {
  const risks = useCourseRisk(courseId, trimester)
  const attend = useMarkRiskAttended()

  const owned = useMemo(
    () => (ownedClassGroupIds ? new Set(ownedClassGroupIds) : null),
    [ownedClassGroupIds]
  )

  // Stable across renders: `rows` feeds the useMemo in both the table and the cards, and a fresh
  // array every render would make them recompute every time, which is memoising nothing.
  const rows = useMemo(() => risks.data ?? [], [risks.data])

  if (!courseId) {
    return (
      <p className="text-sm text-muted-foreground">
        Selecciona un curso para ver sus predicciones.
      </p>
    )
  }

  if (risks.isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2Icon className="size-4 animate-spin" />
        Cargando predicciones…
      </div>
    )
  }

  // A failed request must not fall into the empty table. "Sin predicciones para este trimestre" is
  // an answer about the course — nobody the model is calling for — and it is the opposite of the
  // one a request that never arrived deserves.
  if (risks.isError) {
    return (
      <p className="text-sm text-destructive">
        No se pudo cargar las predicciones del curso. Reintenta en un momento.
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <RiskSummaryCards rows={rows} />
      <RiskTable
        rows={rows}
        isBusy={attend.isPending}
        canAttend={owned ? (risk) => owned.has(risk.classGroupId) : undefined}
        onToggleAttended={
          owned
            ? (risk, attended) => attend.mutate({ id: risk.id, attended })
            : undefined
        }
      />
    </div>
  )
}
