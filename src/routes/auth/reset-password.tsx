import { createFileRoute, redirect } from "@tanstack/react-router"

import { AuthLayout } from "@/features/auth/components/AuthLayout"
import { ResetPasswordForm } from "@/features/auth/components/ResetPasswordForm"
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
    <AuthLayout
      title="Elige una contraseña nueva"
      subtitle="La vas a usar para entrar desde ahora."
    >
      <ResetPasswordForm token={token} />
    </AuthLayout>
  )
}
