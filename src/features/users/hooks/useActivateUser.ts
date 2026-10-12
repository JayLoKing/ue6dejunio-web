import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import { UserService } from "../services/userService"
import type { UserResponse } from "../models/response/user-response"
import { catalogKeys } from "@/features/catalog/hooks/useCatalog"
import { invalidateCourses } from "@/features/courses/hooks/useCourses"

import { usersKeys } from "./useUsers"

/**
 * El camino de vuelta de `useDeactivateUser`, y por eso invalida lo mismo: el docente habilitado
 * vuelve al selector del catálogo, y sus cursos cambian `homeroomTeacherActive`. El endpoint es
 * idempotente, así que habilitar una cuenta ya activa no es un error.
 */
export function useActivateUser() {
  const qc = useQueryClient()

  return useMutation<UserResponse, Error, string>({
    mutationFn: (id) => UserService.activate(id),
    onSuccess: () => {
      toast.success("Usuario habilitado.")
      void qc.invalidateQueries({ queryKey: usersKeys.all })
      void qc.invalidateQueries({ queryKey: catalogKeys.teachersAll })
      invalidateCourses(qc)
    },
  })
}
