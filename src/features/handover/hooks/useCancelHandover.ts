import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import { catalogKeys } from "@/features/catalog/hooks/useCatalog"
import { usersKeys } from "@/features/users/hooks/useUsers"

import { HandoverService } from "../services/handoverService"
import { handoverKeys } from "./useDirectorHandover"

/**
 * Cancela el cambio pendiente. La API devuelve a quien se ascendió a su rol anterior, o da de baja
 * a la cuenta que el cambio creó, así que la lista de usuarios y el catálogo de docentes se releen.
 */
export function useCancelHandover() {
  const qc = useQueryClient()

  return useMutation<void, Error, void>({
    mutationFn: () => HandoverService.cancel(),
    onSuccess: () => {
      toast.success("Cambio de Director cancelado.")
      void qc.invalidateQueries({ queryKey: handoverKeys.all })
      void qc.invalidateQueries({ queryKey: usersKeys.all })
      void qc.invalidateQueries({ queryKey: catalogKeys.teachersAll })
    },
    onError: () => {
      // Un 404 es "ya no había nada que cancelar" (se cerró o lo canceló otro): el aviso viejo
      // sobra, y releer es lo que lo quita.
      void qc.invalidateQueries({ queryKey: handoverKeys.all })
    },
  })
}
