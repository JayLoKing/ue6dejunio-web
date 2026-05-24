import { createFileRoute, redirect } from "@tanstack/react-router"

import { LoginForm } from "@/features/auth/components/LoginForm"
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
    <div className="flex min-h-svh items-center justify-center bg-muted/40 p-6">
      <LoginForm />
    </div>
  )
}
