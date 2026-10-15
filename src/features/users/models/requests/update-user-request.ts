import type { SortDir } from "@/lib/types/pagination"

export interface UpdateUserRequest {
  names?: string
  lastNames?: string
  phone?: string
  roleId?: number
  /**
   * Sólo cuando cambió. Si la persona nunca entró, la API le manda una contraseña nueva a esta
   * dirección y lo dice en `credentialsResent`.
   */
  email?: string
}

export interface ListUsersQuery {
  offset?: number
  limit?: number
  search?: string
  sort?: SortDir
}
