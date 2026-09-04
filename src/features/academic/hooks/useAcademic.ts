import {
  keepPreviousData,
  skipToken,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query"
import { toast } from "sonner"

import type { PageQuery } from "@/lib/types/pagination"

import {
  GradeAdminService,
  KnowledgeAreaAdminService,
  LevelService,
  ParallelService,
  SubjectAdminService,
  TrimesterPeriodService,
} from "../services/academicServices"
import type {
  CreateTrimesterPeriodPayload,
  UpdateTrimesterPeriodPayload,
} from "../types"

const useResourceList = <T>(
  key: string,
  fn: (q: PageQuery) => Promise<T>,
  q: PageQuery
) =>
  useQuery({
    queryKey: [key, q],
    queryFn: () => fn(q),
    placeholderData: keepPreviousData,
  })

export const useLevels = (q: PageQuery) =>
  useResourceList("levels", LevelService.list, q)
export const useGradesAdmin = (q: PageQuery) =>
  useResourceList("grades", GradeAdminService.list, q)
export const useParallels = (q: PageQuery) =>
  useResourceList("parallels", ParallelService.list, q)
export const useSubjectsAdmin = (q: PageQuery) =>
  useResourceList("subjects", SubjectAdminService.list, q)
export const useKnowledgeAreas = (q: PageQuery) =>
  useResourceList("knowledge-areas", KnowledgeAreaAdminService.list, q)

/**
 * Todas las áreas de una, para los selectores.
 *
 * Son cuatro y casi nunca cambian, así que una página basta y se cachean cinco minutos: el
 * formulario de materias no puede ofrecer un área que quedó fuera de la primera página.
 */
export const useAllKnowledgeAreas = () =>
  useQuery({
    queryKey: ["knowledge-areas", "all"],
    queryFn: () =>
      KnowledgeAreaAdminService.list({ offset: 1, limit: 100, sort: "asc" }),
    staleTime: 5 * 60_000,
  })

function mutationFactory<V>(
  key: string,
  fn: (v: V) => Promise<unknown>,
  successMsg: string
) {
  return function useResourceMutation() {
    const qc = useQueryClient()
    return useMutation({
      mutationFn: fn,
      onSuccess: () => {
        toast.success(successMsg)
        void qc.invalidateQueries({ queryKey: [key] })
      },
    })
  }
}

// Levels
export const useCreateLevel = mutationFactory(
  "levels",
  (p: { name: string }) => LevelService.create(p),
  "Nivel creado."
)
export const useUpdateLevel = mutationFactory(
  "levels",
  (v: { id: number; name: string }) =>
    LevelService.update(v.id, { name: v.name }),
  "Nivel actualizado."
)
export const useDeleteLevel = mutationFactory(
  "levels",
  (id: number) => LevelService.remove(id),
  "Nivel eliminado."
)

// Parallels
export const useCreateParallel = mutationFactory(
  "parallels",
  (p: { name: string }) => ParallelService.create(p),
  "Paralelo creado."
)
export const useUpdateParallel = mutationFactory(
  "parallels",
  (v: { id: number; name: string }) =>
    ParallelService.update(v.id, { name: v.name }),
  "Paralelo actualizado."
)
export const useDeleteParallel = mutationFactory(
  "parallels",
  (id: number) => ParallelService.remove(id),
  "Paralelo eliminado."
)

// Grades
export const useCreateGrade = mutationFactory(
  "grades",
  (p: { name: string; id_level: number }) => GradeAdminService.create(p),
  "Grado creado."
)
export const useUpdateGrade = mutationFactory(
  "grades",
  (v: { id: number; name: string; id_level: number }) =>
    GradeAdminService.update(v.id, { name: v.name, id_level: v.id_level }),
  "Grado actualizado."
)
export const useDeleteGrade = mutationFactory(
  "grades",
  (id: number) => GradeAdminService.remove(id),
  "Grado eliminado."
)

// Knowledge areas
export const useCreateKnowledgeArea = mutationFactory(
  "knowledge-areas",
  (p: { name: string; displayOrder?: number }) =>
    KnowledgeAreaAdminService.create(p),
  "Área de saberes creada."
)
export const useUpdateKnowledgeArea = mutationFactory(
  "knowledge-areas",
  (v: { id: number; name: string; displayOrder?: number }) =>
    KnowledgeAreaAdminService.update(v.id, {
      name: v.name,
      displayOrder: v.displayOrder,
    }),
  "Área de saberes actualizada."
)
export const useDeleteKnowledgeArea = mutationFactory(
  "knowledge-areas",
  (id: number) => KnowledgeAreaAdminService.remove(id),
  "Área de saberes eliminada."
)

// Subjects
export const useCreateSubject = mutationFactory(
  "subjects",
  (p: { name: string; id_area: number; technical: boolean }) =>
    SubjectAdminService.create(p),
  "Materia creada."
)
export const useUpdateSubject = mutationFactory(
  "subjects",
  (v: { id: string; name: string; id_area: number; technical: boolean }) =>
    SubjectAdminService.update(v.id, {
      name: v.name,
      id_area: v.id_area,
      technical: v.technical,
    }),
  "Materia actualizada."
)
export const useDeleteSubject = mutationFactory(
  "subjects",
  (id: string) => SubjectAdminService.remove(id),
  "Materia eliminada."
)

// Trimester periods (fechas por trimestre del año académico)
const TRIMESTER_KEY = ["trimester-periods"]

export function useTrimesterPeriods(academicYearId: number | null | undefined) {
  return useQuery({
    queryKey: [...TRIMESTER_KEY, academicYearId ?? 0],
    queryFn: academicYearId
      ? () => TrimesterPeriodService.list(academicYearId)
      : skipToken,
  })
}

function useInvalidateTrimesters() {
  const qc = useQueryClient()
  return () => {
    void qc.invalidateQueries({ queryKey: TRIMESTER_KEY })
    // El catálogo alimenta los selectores de notas → refrescar también.
    void qc.invalidateQueries({ queryKey: ["catalog", "trimesters"] })
  }
}

export function useCreateTrimesterPeriod() {
  const invalidate = useInvalidateTrimesters()
  return useMutation({
    mutationFn: (p: CreateTrimesterPeriodPayload) =>
      TrimesterPeriodService.create(p),
    onSuccess: () => {
      toast.success("Trimestre configurado.")
      invalidate()
    },
  })
}

export function useUpdateTrimesterPeriod() {
  const invalidate = useInvalidateTrimesters()
  return useMutation({
    mutationFn: (v: { id: string; payload: UpdateTrimesterPeriodPayload }) =>
      TrimesterPeriodService.update(v.id, v.payload),
    onSuccess: () => {
      toast.success("Trimestre actualizado.")
      invalidate()
    },
  })
}

export function useDeleteTrimesterPeriod() {
  const invalidate = useInvalidateTrimesters()
  return useMutation({
    mutationFn: (id: string) => TrimesterPeriodService.remove(id),
    onSuccess: () => {
      toast.success("Trimestre eliminado.")
      invalidate()
    },
  })
}
