import { createFileRoute } from "@tanstack/react-router"
import { Loader2Icon } from "lucide-react"

import { useCurrentContext } from "@/features/auth/hooks/useCurrentContext"
import { useTrimesters } from "@/features/catalog/hooks/useCatalog"
import { currentTrimester } from "@/features/catalog/utils/currentTrimester"
import {
  useCourseOverview,
  useTeacherClassGroups,
} from "@/features/courses/hooks/useCourses"
import { SubjectScoreSheet } from "@/features/notebook/components/SubjectScoreSheet"
import type { Trimester } from "@/features/notebook/types"

export const Route = createFileRoute("/_app/scores/$classGroupId/")({
  component: ClassGroupScorePage,
})

function ClassGroupScorePage() {
  const { classGroupId } = Route.useParams()
  const { userId, homeroomCourseId, isTechnical } = useCurrentContext()

  const ownQuery = useTeacherClassGroups(userId)
  // La hoja abre en el trimestre en curso, el mismo que usa la barra lateral; por eso la hoja se
  // monta recién con el calendario cargado: montada antes, se quedaría en el 1.
  const trimestersQuery = useTrimesters()
  const inProgress = currentTrimester(trimestersQuery.data)
  const trimester: Trimester =
    inProgress === 2 || inProgress === 3 ? inProgress : 1
  // Docente de aula: además de sus materias, puede ver las técnicas del curso (solo lectura).
  const overviewQuery = useCourseOverview(
    isTechnical ? null : homeroomCourseId,
    trimester
  )

  if (
    ownQuery.isLoading ||
    overviewQuery.isLoading ||
    trimestersQuery.isLoading
  ) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2Icon className="size-4 animate-spin" /> Cargando materia…
      </div>
    )
  }

  // Materia propia → editable. Materia del curso pero de otro docente (técnico) → solo lectura.
  const own = ownQuery.data?.find((c) => c.id === classGroupId)
  const fromCourse = overviewQuery.data?.classGroups.find(
    (c) => c.id === classGroupId
  )
  const classGroup = own ?? fromCourse

  if (!classGroup) {
    return (
      <div className="rounded-md border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
        Materia no encontrada o no asignada a tu cuenta.
      </div>
    )
  }

  const readOnly = classGroup.teacherId !== userId

  return (
    <SubjectScoreSheet
      classGroup={classGroup}
      readOnly={readOnly}
      studentSummaryLink={homeroomCourseId !== classGroup.courseId}
      initialTrimester={trimester}
    />
  )
}
