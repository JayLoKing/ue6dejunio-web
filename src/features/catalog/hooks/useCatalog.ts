import { useQuery } from "@tanstack/react-query"

import { CatalogService } from "../services/catalogService"

/**
 * El catálogo se guarda cinco minutos porque casi nunca cambia — salvo cuando alguien lo cambia.
 * Quien lo cambie tiene que invalidar su clave: un alta de usuario no toca
 * `["catalog","teachers"]` por su cuenta, y el docente recién creado no aparecía en los selectores
 * hasta que la caché venciera sola.
 */
export const catalogKeys = {
  grades: ["catalog", "grades"] as const,
  parallels: ["catalog", "parallels"] as const,
  subjects: ["catalog", "subjects"] as const,
  teachers: (technical?: boolean) =>
    ["catalog", "teachers", technical ?? "all"] as const,
  /** Las tres listas de docentes a la vez: técnicos, de aula y todos. */
  teachersAll: ["catalog", "teachers"] as const,
  trimesters: (academicYearId?: number) =>
    ["catalog", "trimesters", academicYearId ?? "current"] as const,
  academicYears: ["catalog", "academic-years"] as const,
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

/**
 * Las gestiones, de la más reciente a la más antigua.
 *
 * La primera es la actual — el backend ordena así, y de ahí sale la que el directorio muestra
 * cuando nadie eligió ninguna.
 */
export const useAcademicYears = () =>
  useQuery({
    queryKey: catalogKeys.academicYears,
    queryFn: CatalogService.academicYears,
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
