import { useMutation } from "@tanstack/react-query"
import { toast } from "sonner"

import { StudentService } from "../services/studentService"
import type {
  EnrollBatchRequest,
  EnrollSingleRequest,
} from "../models/requests/enroll-request"
import type { EnrollResponse } from "../models/response/enroll-response"

export function useEnrollSingle() {
  return useMutation<EnrollResponse, Error, EnrollSingleRequest>({
    mutationFn: (payload) => StudentService.enrollSingle(payload),
    onSuccess: (r) =>
      toast.success(
        `Estudiante inscrito. ${r.enrollmentsCreated} inscripcion(es) generadas.`,
      ),
  })
}

export function useEnrollBatch() {
  return useMutation<EnrollResponse, Error, EnrollBatchRequest>({
    mutationFn: (payload) => StudentService.enrollBatch(payload),
    onSuccess: (r) =>
      toast.success(
        `Nomina procesada. ${r.studentsCreated} nuevos, ${r.studentsExisting} existentes, ${r.enrollmentsCreated} inscripciones.`,
      ),
  })
}
