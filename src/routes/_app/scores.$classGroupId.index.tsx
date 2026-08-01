import { createFileRoute } from "@tanstack/react-router"
import { Loader2Icon } from "lucide-react"

import { useAuthStore } from "@/features/auth/store/authStore"
import { useTeacherClassGroups } from "@/features/courses/hooks/useCourses"
import { SubjectScoreSheet } from "@/features/notebook/components/SubjectScoreSheet"

export const Route = createFileRoute("/_app/scores/$classGroupId/")({
  component: ClassGroupScorePage,
})

function ClassGroupScorePage() {
  const { classGroupId } = Route.useParams()
  const userId = useAuthStore((s) => s.userId)
  const { data: classGroups, isLoading } = useTeacherClassGroups(userId)

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2Icon className="size-4 animate-spin" /> Cargando materia…
      </div>
    )
  }

  const cg = classGroups?.find((c) => c.id === classGroupId)
  if (!cg) {
    return (
      <div className="rounded-md border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
        Materia no encontrada o no asignada a tu cuenta.
      </div>
    )
  }

  return <SubjectScoreSheet classGroup={cg} />
}
