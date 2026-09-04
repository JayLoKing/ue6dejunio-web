import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import { UserService } from "../services/userService"
import { catalogKeys } from "@/features/catalog/hooks/useCatalog"

import { usersKeys } from "./useUsers"

export function useDeactivateUser() {
  const qc = useQueryClient()

  return useMutation<void, Error, string>({
    mutationFn: (id) => UserService.deactivate(id),
    onSuccess: () => {
      toast.success("Usuario dado de baja.")
      void qc.invalidateQueries({ queryKey: usersKeys.all })
      // El selector de docentes sale del catálogo, que se cachea aparte: sin esto el docente
      // dado de baja se sigue ofreciendo al asignar materias hasta que la caché venza sola.
      void qc.invalidateQueries({ queryKey: catalogKeys.teachersAll })
    },
  })
}
