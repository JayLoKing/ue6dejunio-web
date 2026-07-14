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
  setSession: (data: CredentialResponse) => void
  logout: () => void
}

export const isRole = (raw: string | null, target: UserRole): boolean =>
  (raw ?? "").toUpperCase() === target
