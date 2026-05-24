import { createFileRoute, redirect } from "@tanstack/react-router"

import { useAuthStore } from "@/features/auth/store/authStore"
import { isRole } from "@/features/auth/types"

export const Route = createFileRoute("/_app/courses")({
  beforeLoad: () => {
    const role = useAuthStore.getState().role
    if (!isRole(role, "DIRECTOR")) {
      throw redirect({ to: "/dashboard" })
    }
  },
  component: CoursesPage,
})

function CoursesPage() {
  return (
    <div className="flex flex-col gap-2">
      <h1 className="text-2xl font-semibold">Cursos</h1>
      <p className="text-muted-foreground">
        Gestion de grupos academicos (proximamente).
      </p>
    </div>
  )
}
