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
      toast.success(
        `Nómina procesada. ${r.studentsCreated} nuevos, ${r.studentsExisting} existentes, ${r.enrollmentsCreated} inscripciones.`
      )
    },
  })
}
