import { createFileRoute, redirect } from "@tanstack/react-router"

import { useAuthStore } from "@/features/auth/store/authStore"

export const Route = createFileRoute("/")({
  beforeLoad: () => {
    const token = useAuthStore.getState().accessToken
    if (!token) {
      throw redirect({ to: "/auth/login" })
    }
    throw redirect({ to: "/dashboard" })
  },
})
