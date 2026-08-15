import { useMutation, type UseMutationResult } from "@tanstack/react-query"
import { useNavigate } from "@tanstack/react-router"
import { toast } from "sonner"

import { AuthService } from "../services/authService"
import type {
  ForgotPasswordRequest,
  ResetPasswordRequest,
} from "../models/requests/credentials-request"
import type { ForgotPasswordResponse } from "../models/response/credential-response"

export function useForgotPassword(): UseMutationResult<
  ForgotPasswordResponse,
  Error,
  ForgotPasswordRequest
> {
  return useMutation<ForgotPasswordResponse, Error, ForgotPasswordRequest>({
    mutationFn: (payload) => AuthService.forgotPassword(payload),
  })
}

export function useResetPassword(): UseMutationResult<
  void,
  Error,
  ResetPasswordRequest
> {
  const navigate = useNavigate()
  return useMutation<void, Error, ResetPasswordRequest>({
    mutationFn: (payload) => AuthService.resetPassword(payload),
    onSuccess: () => {
      toast.success("Contraseña restablecida. Inicia sesión.")
      void navigate({ to: "/auth/login" })
    },
  })
}
