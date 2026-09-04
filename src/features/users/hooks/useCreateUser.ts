import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import { UserService } from "../services/userService"
import { catalogKeys } from "@/features/catalog/hooks/useCatalog"

import { usersKeys } from "./useUsers"
import type { CreateUserRequest } from "../models/requests/create-user-request"
import type { UserResponse } from "../models/response/user-response"

export function useCreateUser() {
  const qc = useQueryClient()

  return useMutation<UserResponse, Error, CreateUserRequest>({
    mutationFn: (payload) => UserService.create(payload),
    onSuccess: (user) => {
      toast.success(`Usuario ${user.names} ${user.lastNames} creado.`)
      void qc.invalidateQueries({ queryKey: usersKeys.all })
      // El selector de docentes sale del catálogo, que se cachea aparte: sin esto el docente
      // recién creado no aparece al asignar materias hasta que la caché venza sola.
      void qc.invalidateQueries({ queryKey: catalogKeys.teachersAll })
    },
  })
}
