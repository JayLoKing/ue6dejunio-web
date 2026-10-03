import { createFileRoute, Link } from "@tanstack/react-router"
import { ArrowLeftIcon, Loader2Icon } from "lucide-react"

import { useCurrentContext } from "@/features/auth/hooks/useCurrentContext"
import { useTeacherClassGroups } from "@/features/courses/hooks/useCourses"
import { StudentGradesDetail } from "@/features/gradebook/components/StudentGradesDetail"

// Resumen de un estudiante para quien dicta una materia en su curso. El árbol /scores ya es de
// docentes; acá el docente que no es de aula recibe solo sus materias (la API lo recorta).
export const Route = createFileRoute(
  "/_app/scores/$classGroupId/estudiante/$enrollmentId"
)({
  component: StudentSummaryPage,
})

function StudentSummaryPage() {
  const { classGroupId, enrollmentId } = Route.useParams()
  const { userId, homeroomCourseId } = useCurrentContext()
  const ownQuery = useTeacherClassGroups(userId)

  if (ownQuery.isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2Icon className="size-4 animate-spin" /> Cargando…
      </div>
    )
  }

  const classGroup = ownQuery.data?.find((c) => c.id === classGroupId)
  if (ownQuery.isError || !classGroup) {
    return (
      <div className="rounded-md border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
        Materia no encontrada o no asignada a tu cuenta.
      </div>
    )
  }

  return (
    <div className="flex min-w-0 flex-col gap-4">
      <Link
        to="/scores/$classGroupId"
        params={{ classGroupId }}
        className="inline-flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeftIcon className="size-4" /> Volver a la materia
      </Link>
      <StudentGradesDetail
        courseEnrollmentId={enrollmentId}
        ownSubjectsOnly={homeroomCourseId !== classGroup.courseId}
      />
    </div>
  )
}
