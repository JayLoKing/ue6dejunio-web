import { useQuery } from "@tanstack/react-query"

import { CatalogService } from "../services/catalogService"

export const catalogKeys = {
  grades: ["catalog", "grades"] as const,
  parallels: ["catalog", "parallels"] as const,
  subjects: ["catalog", "subjects"] as const,
  teachers: ["catalog", "teachers"] as const,
}

export const useGrades = () =>
  useQuery({
    queryKey: catalogKeys.grades,
    queryFn: CatalogService.grades,
    staleTime: 5 * 60_000,
  })

export const useParallels = () =>
  useQuery({
    queryKey: catalogKeys.parallels,
    queryFn: CatalogService.parallels,
    staleTime: 5 * 60_000,
  })
