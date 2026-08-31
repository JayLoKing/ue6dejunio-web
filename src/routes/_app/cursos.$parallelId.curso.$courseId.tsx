import { createFileRoute, Outlet } from "@tanstack/react-router"

// Layout del curso (supervisión): cuaderno en index, detalle de estudiante en el Outlet.
export const Route = createFileRoute(
  "/_app/cursos/$parallelId/curso/$courseId"
)({
  component: () => <Outlet />,
})
