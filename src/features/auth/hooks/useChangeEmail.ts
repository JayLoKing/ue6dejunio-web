import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import { AuthService } from "../services/authService"
import { useAuthStore } from "../store/authStore"
import type { ChangeEmailRequest } from "../models/requests/credentials-request"
import type { CredentialResponse } from "../models/response/credential-response"
import { profileKey } from "./useProfile"

/**
 * Cambia el correo propio y se queda con la sesión nueva que contesta la API.
 *
 * El token se identifica por el id, así que el cambio no corta la sesión; pero lleva el correo, y
 * el que ya existe sigue diciendo el anterior. La respuesta trae uno nuevo y guardarlo pone al día
 * el encabezado sin pedir que se vuelva a entrar.
 *
 * Los errores no se tocan acá: el interceptor ya muestra el mensaje de la API. Una contraseña mal
 * escrita vuelve 400, no 401, justamente para que no se lea como una sesión vencida.
 */
export function useChangeEmail() {
  const qc = useQueryClient()
  const setSession = useAuthStore((s) => s.setSession)

  return useMutation<CredentialResponse, Error, ChangeEmailRequest>({
    mutationFn: (payload) => AuthService.changeEmail(payload),
    onSuccess: (session) => {
      setSession(session)
      toast.success("Correo actualizado.")
      void qc.invalidateQueries({ queryKey: profileKey })
      void qc.invalidateQueries({ queryKey: ["auth", "me"] })
    },
  })
}
