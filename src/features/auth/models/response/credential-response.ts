export interface CredentialResponse {
  userId: string
  email: string
  fullName: string
  role: string
  accessToken: string
  tokenType: string
  expiresAt: string
  mustChangePassword: boolean
  gradeName: string | null
  parallelName: string | null
  courseId: string | null
  /** null para director/secretario; true=tecnico, false=no tecnico (docente). */
  technical: boolean | null
}

export interface ForgotPasswordResponse {
  message: string
}

export interface MeResponse {
  userId: string
  email: string
  name: string
  role: string
  mustChangePassword: boolean
  gradeName: string | null
  parallelName: string | null
  courseId: string | null
  technical: boolean | null
}
