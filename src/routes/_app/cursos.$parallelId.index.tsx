import { createFileRoute } from "@tanstack/react-router"

import { ParallelCoursesPage } from "@/features/courses/components/ParallelCoursesPage"

export const Route = createFileRoute("/_app/cursos/$parallelId/")({
  component: ParallelCoursesRoute,
})

function ParallelCoursesRoute() {
  const { parallelId } = Route.useParams()
  return <ParallelCoursesPage parallelId={parallelId} />
}
