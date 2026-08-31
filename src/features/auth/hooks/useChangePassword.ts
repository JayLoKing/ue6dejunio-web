import { useMutation } from "@tanstack/react-query"
import { toast } from "sonner"

import { AuthService } from "../services/authService"
import { useAuthStore } from "../store/authStore"
import type { ChangePasswordRequest } from "../models/requests/credentials-request"

export function useChangePassword() {
  const logout = useAuthStore((s) => s.logout)

  return useMutation<void, Error, ChangePasswordRequest>({
    mutationFn: (payload) => AuthService.changePassword(payload),
    onSuccess: () => {
      toast.success("Contraseña actualizada. Vuelve a iniciar sesión.")
      logout()
      window.location.href = "/auth/login"
    },
  })
}
