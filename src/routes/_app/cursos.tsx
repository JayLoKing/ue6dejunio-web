import { createFileRoute, redirect, Outlet } from "@tanstack/react-router"

import { useAuthStore } from "@/features/auth/store/authStore"
import { coursePermissions } from "@/features/courses/utils/coursePermissions"

export const Route = createFileRoute("/_app/cursos")({
  beforeLoad: () => {
    // La secretaría entra a reasignar el docente de aula de un curso; el cuaderno de abajo lo cierra su
    // propio guard.
    if (!coursePermissions(useAuthStore.getState().role).canSetHomeroom) {
      throw redirect({ to: "/dashboard" })
    }
  },
  component: () => (
    <div className="flex min-w-0 flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">Cursos</h1>
        <p className="text-sm text-muted-foreground">
          Selecciona un paralelo en el menú lateral.
        </p>
      </div>
      <Outlet />
    </div>
  ),
})
