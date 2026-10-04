import { useMutation } from "@tanstack/react-query"

import { HandoverService } from "../services/handoverService"
import type { UserLookup } from "../models/response/handover-response"

/** Pregunta de quién es un correo; es una acción puntual del formulario, no un dato que se cachee. */
export function useLookupUser() {
  return useMutation<UserLookup | null, Error, string>({
    mutationFn: (email) => HandoverService.lookup(email),
  })
}
