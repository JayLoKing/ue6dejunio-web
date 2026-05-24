import { useAuthStore } from "../store/authStore"

export function useAuth() {
  const accessToken = useAuthStore((s) => s.accessToken)
  const role = useAuthStore((s) => s.role)
  const fullName = useAuthStore((s) => s.fullName)
  const mustChangePassword = useAuthStore((s) => s.mustChangePassword)
  const logout = useAuthStore((s) => s.logout)

  return {
    isAuthenticated: Boolean(accessToken),
    accessToken,
    role,
    fullName,
    mustChangePassword,
    logout,
  }
}
