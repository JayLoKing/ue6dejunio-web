import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import { UserService } from "../services/userService"
import { usersKeys } from "./useUsers"

export function useDeactivateUser() {
  const qc = useQueryClient()

  return useMutation<void, Error, string>({
    mutationFn: (id) => UserService.deactivate(id),
    onSuccess: () => {
      toast.success("Usuario dado de baja.")
      void qc.invalidateQueries({ queryKey: usersKeys.all })
    },
  })
}
