import { createFileRoute, redirect } from "@tanstack/react-router"

import { LoginForm } from "@/features/auth/components/LoginForm"
import { GravityStarsBackground } from "@/components/animate-ui/components/backgrounds/gravity-stars"
import { useAuthStore } from "@/features/auth/store/authStore"

export const Route = createFileRoute("/auth/login")({
  beforeLoad: () => {
    const token = useAuthStore.getState().accessToken
    if (token) {
      throw redirect({ to: "/dashboard" })
    }
  },
  component: LoginPage,
})

function LoginPage() {
  return (
    <div className="relative flex min-h-svh items-center justify-center overflow-hidden bg-background p-6">
      <GravityStarsBackground
        className="absolute inset-0 -z-0"
        starsCount={120}
        mouseGravity="attract"
      />
      <div className="relative z-10 w-full max-w-md">
        <LoginForm />
      </div>
    </div>
  )
}
