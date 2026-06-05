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
}

export interface MeResponse {
  userId: string
  email: string
  name: string
  role: string
  mustChangePassword: boolean
  gradeName: string | null
  parallelName: string | null
}
