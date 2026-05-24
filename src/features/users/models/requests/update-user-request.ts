export interface UpdateUserRequest {
  names?: string
  lastNames?: string
  phone?: string
  roleId?: number
  active?: boolean
}

export interface ListUsersQuery {
  page?: number
  size?: number
  search?: string
  sort?: string
}
