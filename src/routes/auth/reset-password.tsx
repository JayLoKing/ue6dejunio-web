import { createFileRoute, redirect } from "@tanstack/react-router"

import { ResetPasswordForm } from "@/features/auth/components/ResetPasswordForm"
import { GravityStarsBackground } from "@/components/animate-ui/components/backgrounds/gravity-stars"
import { useAuthStore } from "@/features/auth/store/authStore"

interface ResetSearch {
  token: string | null
}

export const Route = createFileRoute("/auth/reset-password")({
  validateSearch: (search: Record<string, unknown>): ResetSearch => ({
    token: typeof search.token === "string" ? search.token : null,
  }),
  beforeLoad: () => {
    if (useAuthStore.getState().accessToken) {
      throw redirect({ to: "/dashboard" })
    }
  },
  component: ResetPasswordPage,
})

function ResetPasswordPage() {
  const { token } = Route.useSearch()
  return (
    <div className="relative flex min-h-svh items-center justify-center overflow-hidden bg-background p-6">
      <GravityStarsBackground
        className="absolute inset-0 -z-10"
        starsCount={120}
        mouseGravity="attract"
      />
      <div className="relative z-10 w-full max-w-md">
        <ResetPasswordForm token={token} />
      </div>
    </div>
  )
}
