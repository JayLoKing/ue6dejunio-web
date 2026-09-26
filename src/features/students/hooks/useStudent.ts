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

/**
 * Movimiento matricular de una gestión: altas y bajas por mes, y bajas por motivo. Sólo Dirección
 * y Secretaría.
 *
 * `academicYearId` ausente es una consulta válida, no una espera: sin él la API responde por la
 * gestión actual. Por eso, a diferencia de `useStudentDetail`, este hook no usa `skipToken` — la
 * clave de la consulta sí distingue "sin gestión elegida" de una gestión puntual.
 */
export function useStudentMovementSummary(academicYearId?: number) {
  return useQuery({
    queryKey: ["students", "movement-summary", academicYearId ?? "current"],
    queryFn: () => StudentService.movementSummary(academicYearId),
  })
}
