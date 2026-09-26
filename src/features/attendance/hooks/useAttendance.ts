import { useMutation, useQueryClient } from "@tanstack/react-query"

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
