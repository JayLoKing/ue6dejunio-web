import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import { UserService } from "../services/userService"

import { usersKeys } from "./useUsers"

/**
 * Reenvía las credenciales temporales de quien aún no pasó de la primera contraseña.
 *
 * La API responde 409 si la persona ya eligió la suya o la cuenta está de baja; ese mensaje lo
 * muestra el interceptor. La lista se relee al salir bien porque el botón se habilita por
 * `mustChangePassword`, y ese dato puede haber cambiado mientras la pantalla seguía abierta.
 */
export function useResendCredentials() {
  const qc = useQueryClient()

  return useMutation<void, Error, string>({
    mutationFn: (id) => UserService.resendCredentials(id),
    onSuccess: () => {
      toast.success("Credenciales reenviadas por correo.")
      void qc.invalidateQueries({ queryKey: usersKeys.all })
    },
  })
}
