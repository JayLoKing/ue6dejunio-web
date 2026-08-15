import { createFileRoute, Link } from "@tanstack/react-router"
import { ArrowLeftIcon, UserIcon } from "lucide-react"

import { useAllCourses } from "@/features/courses/hooks/useCourses"
import { CentralizerTable } from "@/features/gradebook/components/CentralizerTable"

export const Route = createFileRoute(
  "/_app/cursos/$parallelId/curso/$courseId/",
)({
  component: CourseGradebookPage,
})

function CourseGradebookPage() {
  const { parallelId, courseId } = Route.useParams()
  const coursesQuery = useAllCourses()
  const course = coursesQuery.data?.content.find((c) => c.id === courseId)

  return (
    <div className="flex min-w-0 flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <Link
          to="/cursos/$parallelId"
          params={{ parallelId }}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeftIcon className="size-4" /> Volver
        </Link>
        <h2 className="text-lg font-semibold">
          Cuaderno pedagógico
          {course ? (
            <span className="ml-2 text-sm font-normal text-muted-foreground">
              {course.gradeName} {course.parallelName}
            </span>
          ) : null}
        </h2>
        {course?.homeroomTeacherName ? (
          <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
            <UserIcon className="size-4" /> {course.homeroomTeacherName}
          </span>
        ) : null}
      </div>

      <p className="text-xs text-muted-foreground">
        Consolidado de solo lectura. Selecciona un estudiante para ver su detalle
        por dimensión.
      </p>

      <CentralizerTable
        courseId={courseId}
        renderStudent={(row) => (
          <Link
            to="/cursos/$parallelId/curso/$courseId/estudiante/$enrollmentId"
            params={{
              parallelId,
              courseId,
              enrollmentId: row.courseEnrollmentId,
            }}
            className="text-univalle underline-offset-4 hover:underline"
          >
            {row.fullName}
          </Link>
        )}
      />
    </div>
  )
}
