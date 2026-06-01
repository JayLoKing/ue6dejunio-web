import type { SortDir } from "@/lib/types/pagination"

export interface UpdateUserRequest {
  names?: string
  lastNames?: string
  phone?: string
  roleId?: number
  active?: boolean
}

export interface ListUsersQuery {
  offset?: number
  limit?: number
  search?: string
  sort?: SortDir
}
