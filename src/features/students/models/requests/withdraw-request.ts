import type { WithdrawalReason } from "../../types"

/**
 * La baja de un estudiante.
 *
 * `note` es opcional salvo cuando el motivo es "Otro": el backend devuelve 400 sin ella, porque esa
 * categoría existe justamente para un motivo que la lista no tiene.
 */
export interface WithdrawStudentRequest {
  reason: WithdrawalReason
  note?: string
}
