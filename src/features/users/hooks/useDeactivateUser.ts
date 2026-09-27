import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import { UserService } from "../services/userService"
import { catalogKeys } from "@/features/catalog/hooks/useCatalog"
import { coursesKeys } from "@/features/courses/hooks/useCourses"

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
      // Y el curso, que lleva `homeroomTeacherActive`. El diálogo de docente de aula lo usa para
      // decidir si bloquea la reasignación, así que sin esto el Director da de baja al docente que
      // se va, vuelve a Cursos y sigue leyendo "primero dale de baja en Usuarios" sobre alguien
      // que acaba de dar de baja. `useAllCourses` cachea cinco minutos: no se corrige sola, hay
      // que recargar la página entera.
      for (const queryKey of coursesKeys.everything) {
        void qc.invalidateQueries({ queryKey })
      }
    },
  })
}
