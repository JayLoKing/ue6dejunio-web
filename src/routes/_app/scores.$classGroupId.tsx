import { createFileRoute, Outlet } from "@tanstack/react-router"

// Layout del cuaderno de una materia: la pantalla vive en index; el detalle
// por criterio (criterio/$criterionId) se muestra en el Outlet.
export const Route = createFileRoute("/_app/scores/$classGroupId")({
  component: () => <Outlet />,
})
