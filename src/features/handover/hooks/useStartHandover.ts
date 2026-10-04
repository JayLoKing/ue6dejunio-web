import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import { catalogKeys } from "@/features/catalog/hooks/useCatalog"
import { usersKeys } from "@/features/users/hooks/useUsers"

import { HandoverService } from "../services/handoverService"
import type { StartHandoverRequest } from "../models/requests/handover-request"
import type { DirectorHandover } from "../models/response/handover-response"
import { handoverKeys } from "./useDirectorHandover"

export function useStartHandover() {
  const qc = useQueryClient()

  return useMutation<DirectorHandover, Error, StartHandoverRequest>({
    mutationFn: (payload) => HandoverService.start(payload),
    onSuccess: (handover) => {
      toast.success(
        `Cambio de Director iniciado. Se enviaron las credenciales a ${handover.incoming.email}.`
      )
      void qc.invalidateQueries({ queryKey: handoverKeys.all })
      // Un ascenso o una cuenta nueva cambian la lista de usuarios y el catálogo de docentes.
      void qc.invalidateQueries({ queryKey: usersKeys.all })
      void qc.invalidateQueries({ queryKey: catalogKeys.teachersAll })
    },
  })
}
