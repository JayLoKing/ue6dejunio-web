import { useQuery } from "@tanstack/react-query"

import { InstitutionService } from "../services/institutionService"

const KEY = ["institution"]

/**
 * The school's heading. It changes about once a decade — the district and the name come from the
 * server's configuration and the Director from whoever holds the role — so it is read once and
 * kept, instead of being fetched again for every document that prints it.
 */
export function useInstitution() {
  return useQuery({
    queryKey: KEY,
    queryFn: () => InstitutionService.current(),
    staleTime: 60 * 60 * 1000,
  })
}
