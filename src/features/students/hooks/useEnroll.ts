import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import { StudentService } from "../services/studentService"
import type {
  EnrollBatchRequest,
  EnrollSingleRequest,
} from "../models/requests/enroll-request"
import type { EnrollResponse } from "../models/response/enroll-response"

/**
 * Tira las listas que la inscripción acaba de dejar desactualizadas.
 *
 * Los dos prefijos, porque el padrón se lee por dos caminos: `/students` va por
 * `useCourseStudents` (`course-students`) y la vista del docente por `useTeacherStudents`
 * (`teachers`). Invalidar uno solo deja al otro con la respuesta que ya tenía, y el docente
 * inscribe a alguien y lo ve no aparecer.
 *
 * Por prefijo y no por clave exacta: ambas se cachean por curso o docente y por página, y el
 * estudiante nuevo cae en la que le toque.
 */
function useInvalidateRosters() {
  const qc = useQueryClient()
  return () => {
    void qc.invalidateQueries({ queryKey: ["course-students"] })
    void qc.invalidateQueries({ queryKey: ["teachers"] })
  }
}

export function useEnrollSingle() {
  const invalidate = useInvalidateRosters()

  return useMutation<EnrollResponse, Error, EnrollSingleRequest>({
    mutationFn: (payload) => StudentService.enrollSingle(payload),
    onSuccess: (r) => {
      invalidate()
      const skipped = r.skippedWithdrawn[0]
      if (skipped) {
        // Un solo estudiante: si se omitió, no se inscribió, y decir lo contrario sería falso.
        toast.warning(
          `${skipped.fullName} está retirado y no se inscribió. Solo el Director puede reincorporarlo.`
        )
        return
      }
      // Ya inscrito en otro curso o con datos en conflicto no llega aquí: la API responde 409 y el
      // interceptor muestra su mensaje. Un retiro de otra gestión sí: se deshizo al inscribirlo.
      const reinstated = r.reinstated[0]
      if (reinstated) {
        toast.success(
          `${reinstated.fullName} se reincorporó de una gestión anterior y quedó inscrito.`
        )
        return
      }
      toast.success(
        `Estudiante inscrito. ${r.enrollmentsCreated} inscripción(es) generadas.`
      )
    },
  })
}

export function useEnrollBatch() {
  const invalidate = useInvalidateRosters()

  return useMutation<EnrollResponse, Error, EnrollBatchRequest>({
    mutationFn: (payload) => StudentService.enrollBatch(payload),
    onSuccess: (r) => {
      invalidate()
      // El detalle (de dónde vino cada estudiante y a quién se omitió) lo muestra el resumen del
      // formulario; el aviso sólo confirma que la carga terminó.
      toast.success(
        `Nómina procesada. ${r.enrollmentsCreated} inscripciones generadas.`
      )
    },
  })
}
