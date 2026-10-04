import { createFileRoute, Outlet, redirect } from "@tanstack/react-router"

import { useAuthStore } from "@/features/auth/store/authStore"
import { coursePermissions } from "@/features/courses/utils/coursePermissions"

// Layout del curso (supervisión): cuaderno en index, detalle de estudiante en el Outlet.
export const Route = createFileRoute(
  "/_app/cursos/$parallelId/curso/$courseId"
)({
  // Dirección y secretaría abren el cuaderno; la API responde 200 a la secretaría en todas sus
  // lecturas. Las escrituras (baja, atender una predicción) no se ofrecen a la secretaría.
  beforeLoad: () => {
    if (!coursePermissions(useAuthStore.getState().role).canOpenNotebook) {
      throw redirect({ to: "/dashboard" })
    }
  },
  component: () => <Outlet />,
})
