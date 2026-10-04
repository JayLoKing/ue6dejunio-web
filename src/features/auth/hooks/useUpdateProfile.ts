import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import { AuthService } from "../services/authService"
import { useAuthStore } from "../store/authStore"
import type { UpdateProfileRequest } from "../models/requests/credentials-request"
import type { CredentialResponse } from "../models/response/credential-response"
import { profileKey } from "./useProfile"

/**
 * Guarda nombres, apellidos y teléfono, y renueva la sesión para que el encabezado cambie.
 *
 * El nombre que se ve sale del token, y el que ya existe sigue diciendo el anterior: la API no
 * emite uno nuevo al guardar. Por eso el guardado se sigue de un `refresh`, la misma puerta del
 * aviso de sesión por vencer.
 *
 * Si sólo la renovación falla, el cambio ya está hecho. Devolver el error mentiría, así que se
 * cuenta como éxito y el aviso dice lo que falta: el encabezado se pone al día en la próxima sesión.
 */
export function useUpdateProfile() {
  const qc = useQueryClient()
  const setSession = useAuthStore((s) => s.setSession)

  return useMutation<CredentialResponse | null, Error, UpdateProfileRequest>({
    mutationFn: async (payload) => {
      await AuthService.updateProfile(payload)
      try {
        return await AuthService.refresh()
      } catch {
        return null
      }
    },
    onSuccess: (session) => {
      if (session) {
        setSession(session)
        toast.success("Perfil actualizado.")
      } else {
        toast.success(
          "Perfil actualizado. Tu nombre se verá al día en el encabezado cuando vuelvas a iniciar sesión."
        )
      }
      void qc.invalidateQueries({ queryKey: profileKey })
      void qc.invalidateQueries({ queryKey: ["auth", "me"] })
    },
  })
}
