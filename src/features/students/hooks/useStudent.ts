import { skipToken, useQuery } from "@tanstack/react-query"

import { StudentService } from "../services/studentService"

/**
 * La ficha de un estudiante, pedida sólo cuando alguien la abre.
 *
 * `skipToken` en vez de `enabled`: sin estudiante no hay consulta, y el tipo lo dice en lugar de
 * dejarlo en una guarda que el compilador no ve. Mismo patrón que `useTeacherStudents`.
 */
export function useStudentDetail(id: string | null | undefined) {
  return useQuery({
    queryKey: ["students", id ?? ""],
    queryFn: id ? () => StudentService.getById(id) : skipToken,
    staleTime: 60_000,
  })
}
