import { useQuery } from "@tanstack/react-query"

import { CatalogService } from "../services/catalogService"

export const catalogKeys = {
  grades: ["catalog", "grades"] as const,
  parallels: ["catalog", "parallels"] as const,
  subjects: ["catalog", "subjects"] as const,
  teachers: (technical?: boolean) =>
    ["catalog", "teachers", technical ?? "all"] as const,
  trimesters: (academicYearId?: number) =>
    ["catalog", "trimesters", academicYearId ?? "current"] as const,
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

export const useSubjects = () =>
  useQuery({
    queryKey: catalogKeys.subjects,
    queryFn: CatalogService.subjects,
    staleTime: 5 * 60_000,
  })

/** technical: true=tecnicos, false=no tecnicos (aula), undefined=todos. */
export const useTeachers = (technical?: boolean) =>
  useQuery({
    queryKey: catalogKeys.teachers(technical),
    queryFn: () => CatalogService.teachers(technical),
    staleTime: 5 * 60_000,
  })

/** Trimestres configurados (por defecto el año académico actual). */
export const useTrimesters = (academicYearId?: number) =>
  useQuery({
    queryKey: catalogKeys.trimesters(academicYearId),
    queryFn: () => CatalogService.trimesters(academicYearId),
    staleTime: 5 * 60_000,
  })
