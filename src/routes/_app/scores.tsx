import { createFileRoute, redirect } from "@tanstack/react-router"

import { useAuthStore } from "@/features/auth/store/authStore"
import { isRole } from "@/features/auth/types"

export const Route = createFileRoute("/_app/scores")({
  beforeLoad: () => {
    const role = useAuthStore.getState().role
    if (!isRole(role, "TEACHER")) {
      throw redirect({ to: "/dashboard" })
    }
  },
})
