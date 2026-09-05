export interface CreateUserRequest {
  ci: string
  names: string
  lastNames: string
  phone: string
  email: string
  roleId: number
  /** Sólo un docente puede serlo; la API guarda false para cualquier otro rol. */
  technical: boolean
}
