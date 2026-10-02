import { createFileRoute, redirect } from "@tanstack/react-router"

import { useAuthStore } from "@/features/auth/store/authStore"
import { isRole } from "@/features/auth/types"
import { TrimesterPeriodsPage } from "@/features/academic/components/TrimesterPeriodsPage"

export const Route = createFileRoute("/_app/trimestres")({
  beforeLoad: () => {
    if (!isRole(useAuthStore.getState().role, "DIRECTOR")) {
      throw redirect({ to: "/dashboard" })
    }
  },
  component: TrimesterPeriodsPage,
})
