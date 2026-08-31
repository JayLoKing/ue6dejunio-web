import { createFileRoute } from "@tanstack/react-router"
import { Loader2Icon } from "lucide-react"

import { useAuthStore } from "@/features/auth/store/authStore"
import { useTeacherClassGroups } from "@/features/courses/hooks/useCourses"
import { useCriteria } from "@/features/assessment/hooks/useAssessment"
import { CriterionScoreSheet } from "@/features/notebook/components/CriterionScoreSheet"

interface CriterionSearch {
  trimester: number
}

export const Route = createFileRoute(
  "/_app/scores/$classGroupId/criterio/$criterionId"
)({
  validateSearch: (search: Record<string, unknown>): CriterionSearch => ({
    trimester: Math.min(3, Math.max(1, Number(search.trimester) || 1)),
  }),
  component: CriterionScorePage,
})

function CriterionScorePage() {
  const { classGroupId, criterionId } = Route.useParams()
  const { trimester } = Route.useSearch()
  const userId = useAuthStore((s) => s.userId)

  const { data: classGroups, isLoading: cgLoading } =
    useTeacherClassGroups(userId)
  const { data: criteria, isLoading: critLoading } = useCriteria(
    classGroupId,
    trimester
  )

  if (cgLoading || critLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2Icon className="size-4 animate-spin" /> Cargando…
      </div>
    )
  }

  const classGroup = classGroups?.find((c) => c.id === classGroupId)
  const criterion = criteria?.find((c) => c.id === criterionId)

  if (!classGroup || !criterion) {
    return (
      <div className="rounded-md border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
        Criterio no encontrado para esta materia y trimestre.
      </div>
    )
  }

  return <CriterionScoreSheet classGroup={classGroup} criterion={criterion} />
}
