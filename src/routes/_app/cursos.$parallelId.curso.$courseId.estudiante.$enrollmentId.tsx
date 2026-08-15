import { createFileRoute, Link } from "@tanstack/react-router"
import { ArrowLeftIcon } from "lucide-react"

import { StudentGradesDetail } from "@/features/gradebook/components/StudentGradesDetail"

export const Route = createFileRoute(
  "/_app/cursos/$parallelId/curso/$courseId/estudiante/$enrollmentId",
)({
  component: StudentDetailPage,
})

function StudentDetailPage() {
  const { parallelId, courseId, enrollmentId } = Route.useParams()

  return (
    <div className="flex min-w-0 flex-col gap-4">
      <Link
        to="/cursos/$parallelId/curso/$courseId"
        params={{ parallelId, courseId }}
        className="inline-flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeftIcon className="size-4" /> Volver al cuaderno
      </Link>
      <StudentGradesDetail courseEnrollmentId={enrollmentId} />
    </div>
  )
}
