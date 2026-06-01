import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import { UserService } from "../services/userService"
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
    },
  })
}
