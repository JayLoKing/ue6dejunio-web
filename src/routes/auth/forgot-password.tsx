import { createFileRoute, redirect } from "@tanstack/react-router"

import { AuthLayout } from "@/features/auth/components/AuthLayout"
import { ForgotPasswordForm } from "@/features/auth/components/ForgotPasswordForm"
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
    <AuthLayout
      title="Recupera tu contraseña"
      subtitle="Te enviamos un enlace al correo con el que ingresas."
    >
      <ForgotPasswordForm />
    </AuthLayout>
  )
}
