import { createFileRoute, redirect } from "@tanstack/react-router"

import { useAuthStore } from "@/features/auth/store/authStore"
import { isRole } from "@/features/auth/types"

export const Route = createFileRoute("/_app/reports")({
  beforeLoad: () => {
    const role = useAuthStore.getState().role
    // Los tres roles entran, y cada uno a lo suyo: el docente de aula a su curso, Dirección y
    // Secretaría a cualquiera eligiéndolo. Antes era sólo del docente, así que Dirección leía el
    // consolidado de un curso sólo a través de la vista del curso y Secretaría no lo leía en ningún
    // lado. Quién ve qué pestaña lo decide la página; esto sólo decide quién ve la página.
    if (
      !isRole(role, "TEACHER") &&
      !isRole(role, "DIRECTOR") &&
      !isRole(role, "SECRETARY")
    ) {
      throw redirect({ to: "/dashboard" })
    }
  },
})
