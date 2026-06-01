import { useQuery, keepPreviousData } from "@tanstack/react-query"

import { UserService } from "../services/userService"
import type { ListUsersQuery } from "../models/requests/update-user-request"

export const usersKeys = {
  all: ["users"] as const,
  list: (query: ListUsersQuery) => ["users", "list", query] as const,
  detail: (id: string) => ["users", "detail", id] as const,
}

export function useUsers(query: ListUsersQuery = {}) {
  return useQuery({
    queryKey: usersKeys.list(query),
    queryFn: () => UserService.list(query),
    placeholderData: keepPreviousData,
  })
}
