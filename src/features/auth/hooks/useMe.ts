import { useQuery } from "@tanstack/react-query"

import { AuthService } from "../services/authService"

export function useMe(enabled = true) {
  return useQuery({
    queryKey: ["auth", "me"],
    queryFn: () => AuthService.me(),
    enabled,
    staleTime: 60_000,
  })
}
