import { createFileRoute, redirect } from "@tanstack/react-router"

import { AuthLayout } from "@/features/auth/components/AuthLayout"
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
    <AuthLayout
      title="Ingresa a tu cuenta"
      subtitle="Con el correo que te dio la dirección."
    >
      <LoginForm />
    </AuthLayout>
  )
}
