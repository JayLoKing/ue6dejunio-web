import type { CredentialResponse } from "../models/response/credential-response"

export type UserRole = "DIRECTOR" | "SECRETARY" | "TEACHER"

export interface AuthState {
  userId: string | null
  email: string | null
  fullName: string | null
  role: string | null
  accessToken: string | null
  tokenType: string | null
  expiresAt: string | null
  mustChangePassword: boolean
  gradeName: string | null
  parallelName: string | null
  courseId: string | null
  /** null para director/secretario; true=tecnico, false=no tecnico. */
  isTechnical: boolean | null
  /**
   * La sesión se cayó sola, no la cerró nadie.
   *
   * Separado de `accessToken === null` porque los dos casos se ven igual en el estado y no
   * significan lo mismo: uno merece un cartel que explique por qué, el otro es alguien que apretó
   * "salir" y ya sabe lo que hizo.
   */
  sessionExpired: boolean
  setSession: (data: CredentialResponse) => void
  logout: () => void
  /** Limpia la sesión dejando dicho que venció. La usa el interceptor ante un 401. */
  expireSession: () => void
}

export const isRole = (raw: string | null, target: UserRole): boolean =>
  (raw ?? "").toUpperCase() === target
