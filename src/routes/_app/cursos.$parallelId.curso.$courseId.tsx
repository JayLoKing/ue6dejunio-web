import { createFileRoute, Outlet, redirect } from "@tanstack/react-router"

import { useAuthStore } from "@/features/auth/store/authStore"
import { coursePermissions } from "@/features/courses/utils/coursePermissions"

// Layout del curso (supervisión): cuaderno en index, detalle de estudiante en el Outlet.
export const Route = createFileRoute(
  "/_app/cursos/$parallelId/curso/$courseId"
)({
  // La API le responde 403 a la secretaría en las lecturas del cuaderno: la lista de cursos de su
  // paralelo es hasta donde llega.
  beforeLoad: () => {
    if (!coursePermissions(useAuthStore.getState().role).canOpenNotebook) {
      throw redirect({ to: "/dashboard" })
    }
  },
  component: () => <Outlet />,
})
