import { createFileRoute, redirect, Outlet } from "@tanstack/react-router"

import { useAuthStore } from "@/features/auth/store/authStore"
import { isRole } from "@/features/auth/types"

export const Route = createFileRoute("/_app/cursos")({
  beforeLoad: () => {
    if (!isRole(useAuthStore.getState().role, "DIRECTOR")) {
      throw redirect({ to: "/dashboard" })
    }
  },
  component: () => (
    <div className="flex min-w-0 flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">Cursos</h1>
        <p className="text-sm text-muted-foreground">
          Selecciona un paralelo en el menu lateral.
        </p>
      </div>
      <Outlet />
    </div>
  ),
})
