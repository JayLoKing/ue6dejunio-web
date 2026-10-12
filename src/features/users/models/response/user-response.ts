export interface UserResponse {
  id: string
  ci: string
  names: string
  lastNames: string
  phone: string | null
  email: string
  role: string
  active: boolean
  mustChangePassword: boolean
  createdAt: string
  /** Sólo en la respuesta a una edición: corregir el correo también reenvió las credenciales. */
  credentialsResent?: boolean
}

export interface UsersListItem {
  id: string
  ci: string
  names: string
  lastNames: string
  phone: string | null
  email: string
  role: string
  active: boolean
  /** true mientras la persona no pasó de la contraseña temporal: es lo que habilita el reenvío. */
  mustChangePassword: boolean
}

export interface PagedResponse<T> {
  content: T[]
  page: number
  size: number
  total: number
  totalPages: number
}
