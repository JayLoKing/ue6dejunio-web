import { useMutation } from "@tanstack/react-query"
import { useNavigate } from "@tanstack/react-router"
import { toast } from "sonner"

import { AuthService } from "../services/authService"
import { useAuthStore } from "../store/authStore"
import type { CredentialsRequest } from "../models/requests/credentials-request"
import type { CredentialResponse } from "../models/response/credential-response"

export function useLogin() {
  const setSession = useAuthStore((s) => s.setSession)
  const navigate = useNavigate()

  return useMutation<CredentialResponse, Error, CredentialsRequest>({
    mutationFn: (payload) => AuthService.login(payload),
    onSuccess: (data) => {
      setSession(data)
      toast.success(`Bienvenido ${data.fullName}`)
      void navigate({ to: "/dashboard" })
    },
  })
}
