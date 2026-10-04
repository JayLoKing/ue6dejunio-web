import { useQuery } from "@tanstack/react-query"

import { AuthService } from "../services/authService"

export const profileKey = ["auth", "profile"] as const

/** La propia fila, para el formulario de perfil. Sin caché larga: se lee al abrir el diálogo. */
export function useProfile(enabled = true) {
  return useQuery({
    queryKey: profileKey,
    queryFn: () => AuthService.getProfile(),
    enabled,
  })
}
