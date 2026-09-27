import { useMutation } from "@tanstack/react-query"

import { AuthService } from "../services/authService"
import { useAuthStore } from "../store/authStore"
import type { CredentialResponse } from "../models/response/credential-response"

/**
 * Renueva la sesión con el token que todavía sirve.
 *
 * No se dispara solo, y eso es la decisión: un temporizador que renueva callado mientras la pestaña
 * viva convierte el límite de tiempo en ninguno, y en una computadora compartida de la escuela eso
 * queda abierto hasta que alguien cierre el navegador. Lo pide la persona desde el aviso, así que la
 * sesión se extiende porque alguien lo dijo, no porque nadie apagó la máquina.
 *
 * Tiene que llamarse ANTES de que el token venza: la API exige uno vigente para dar otro. Después
 * del vencimiento no hay nada que renovar y la única salida sigue siendo volver a entrar — por eso
 * el aviso ofrece este botón sólo mientras queda tiempo.
 *
 * El error no se toca acá. Un 403 por cuenta dada de baja y un 401 por token vencido ya los cuenta
 * el interceptor, que además levanta la bandera de sesión vencida; repetirlo mostraría dos carteles
 * del mismo problema.
 */
export function useRefreshSession() {
  const setSession = useAuthStore((s) => s.setSession)

  return useMutation<CredentialResponse, Error, void>({
    mutationFn: () => AuthService.refresh(),
    // La misma puerta que usa el login: el token nuevo trae claims recalculados — el curso de aula
    // entre ellos, que un intercambio le cambia — así que se guarda la respuesta entera y no sólo
    // el token.
    onSuccess: (data) => setSession(data),
  })
}
