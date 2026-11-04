import {
  skipToken,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query"
import { toast } from "sonner"

import { invalidateCourses } from "@/features/courses/hooks/useCourses"

import type { UpdateStudentRequest } from "../models/requests/update-student-request"
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

/**
 * Quienes cursaron la gestión anterior y no tienen cupo en la consultada. Sólo Dirección y
 * Secretaría.
 *
 * Como el movimiento matricular: sin gestión es una consulta válida (la API responde por la
 * actual), y la clave distingue "sin elegir" de una gestión puntual. Cuelga de `["students"]`, así
 * que reincorporar a alguien la invalida junto con el resto.
 */
export function useNotReenrolled(academicYearId?: number) {
  return useQuery({
    queryKey: ["students", "not-reenrolled", academicYearId ?? "current"],
    queryFn: () => StudentService.notReenrolled(academicYearId),
  })
}

/**
 * Corregir o completar los datos de un estudiante.
 *
 * El nombre, el RUDE, el carnet y la marca de datos incompletos se leen desde varios listados: la
 * ficha y el directorio (`["students"]`), el padrón del docente (`["teachers"]`) y el padrón y el
 * cuaderno del curso (`invalidateCourses`). Invalidar uno solo deja a los otros mostrando el dato
 * viejo.
 *
 * Sin toast de error: el interceptor ya muestra el mensaje de la API.
 */
export function useUpdateStudent() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (v: { id: string; payload: UpdateStudentRequest }) =>
      StudentService.update(v.id, v.payload),
    onSuccess: () => {
      toast.success("Datos del estudiante actualizados.")
      void qc.invalidateQueries({ queryKey: ["students"] })
      void qc.invalidateQueries({ queryKey: ["teachers"] })
      invalidateCourses(qc)
    },
  })
}
