import { createFileRoute, Outlet } from "@tanstack/react-router"

// Layout del paralelo: la tabla vive en index; el cuaderno del curso y el
// detalle del estudiante se muestran en el Outlet.
export const Route = createFileRoute("/_app/cursos/$parallelId")({
  component: () => <Outlet />,
})
