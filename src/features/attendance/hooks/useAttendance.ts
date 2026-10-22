import {
  keepPreviousData,
  skipToken,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query"

import type { PageQuery } from "@/lib/types/pagination"

import { AttendanceService } from "../services/attendanceService"
import type {
  DailyAttendancePayload,
  DailyBatchPayload,
  SessionAttendancePayload,
  SessionBatchPayload,
} from "../types"

export function useDailyAttendance() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (p: DailyAttendancePayload) => AttendanceService.daily(p),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["gradebook", "attendance"] })
    },
  })
}

/**
 * Las marcas de sesión ya guardadas de una materia, por estudiante del curso.
 *
 * La clave cuelga de ["gradebook", "attendance"] a propósito: es el prefijo que invalidan los
 * guardados de sesión, así que la grilla se refresca sola después de marcar.
 */
export function useClassGroupSessionAttendance(
  classGroupId: string | null | undefined,
  query: PageQuery
) {
  return useQuery({
    queryKey: ["gradebook", "attendance", "session", classGroupId ?? "", query],
    queryFn: classGroupId
      ? () => AttendanceService.classGroupSessions(classGroupId, query)
      : skipToken,
    placeholderData: keepPreviousData,
  })
}

export function useSessionAttendance() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (p: SessionAttendancePayload) => AttendanceService.session(p),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["gradebook", "attendance"] })
    },
  })
}

/**
 * El curso entero de un saque.
 *
 * Existe porque marcar treinta estudiantes de a uno son treinta peticiones y treinta
 * transacciones: la que falle en el medio deja la lista a medias, y el docente no tiene forma de
 * saber cuál. El lote entra completo o no entra.
 */
export function useDailyAttendanceBatch() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (p: DailyBatchPayload) => AttendanceService.dailyBatch(p),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["gradebook", "attendance"] })
    },
  })
}

export function useSessionAttendanceBatch() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (p: SessionBatchPayload) => AttendanceService.sessionBatch(p),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["gradebook", "attendance"] })
    },
  })
}
