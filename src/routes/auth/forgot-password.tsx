import { createFileRoute, redirect } from "@tanstack/react-router"

import { ForgotPasswordForm } from "@/features/auth/components/ForgotPasswordForm"
import { GravityStarsBackground } from "@/components/animate-ui/components/backgrounds/gravity-stars"
import { useAuthStore } from "@/features/auth/store/authStore"

export const Route = createFileRoute("/auth/forgot-password")({
  beforeLoad: () => {
    if (useAuthStore.getState().accessToken) {
      throw redirect({ to: "/dashboard" })
    }
  },
  component: ForgotPasswordPage,
})

function ForgotPasswordPage() {
  return (
    <div className="relative flex min-h-svh items-center justify-center overflow-hidden bg-background p-6">
      <GravityStarsBackground
        className="absolute inset-0 -z-10"
        starsCount={120}
        mouseGravity="attract"
      />
      <div className="relative z-10 w-full max-w-md">
        <ForgotPasswordForm />
      </div>
    </div>
  )
}
