import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import { UserService } from "../services/userService"
import { catalogKeys } from "@/features/catalog/hooks/useCatalog"

import { usersKeys } from "./useUsers"
import type { UpdateUserRequest } from "../models/requests/update-user-request"
import type { UserResponse } from "../models/response/user-response"

export function useUpdateUser() {
  const qc = useQueryClient()

  return useMutation<
    UserResponse,
    Error,
    { id: string; payload: UpdateUserRequest }
  >({
    mutationFn: ({ id, payload }) => UserService.update(id, payload),
    onSuccess: (user) => {
      toast.success(`Usuario ${user.names} ${user.lastNames} actualizado.`)
      void qc.invalidateQueries({ queryKey: usersKeys.all })
      // El selector de docentes sale del catálogo, que se cachea aparte: sin esto un cambio de
      // rol o de "es técnico" no llega a los selectores hasta que la caché venza sola.
      void qc.invalidateQueries({ queryKey: catalogKeys.teachersAll })
    },
  })
}
