import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query"
import { toast } from "sonner"

import type { PageQuery } from "@/lib/types/pagination"

import {
  GradeAdminService,
  LevelService,
  ParallelService,
  SubjectAdminService,
} from "../services/academicServices"

const useResourceList = <T,>(
  key: string,
  fn: (q: PageQuery) => Promise<T>,
  q: PageQuery,
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

function mutationFactory<V>(
  key: string,
  fn: (v: V) => Promise<unknown>,
  successMsg: string,
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
  "Nivel creado.",
)
export const useUpdateLevel = mutationFactory(
  "levels",
  (v: { id: number; name: string }) => LevelService.update(v.id, { name: v.name }),
  "Nivel actualizado.",
)
export const useDeleteLevel = mutationFactory(
  "levels",
  (id: number) => LevelService.remove(id),
  "Nivel eliminado.",
)

// Parallels
export const useCreateParallel = mutationFactory(
  "parallels",
  (p: { name: string }) => ParallelService.create(p),
  "Paralelo creado.",
)
export const useUpdateParallel = mutationFactory(
  "parallels",
  (v: { id: number; name: string }) =>
    ParallelService.update(v.id, { name: v.name }),
  "Paralelo actualizado.",
)
export const useDeleteParallel = mutationFactory(
  "parallels",
  (id: number) => ParallelService.remove(id),
  "Paralelo eliminado.",
)

// Grades
export const useCreateGrade = mutationFactory(
  "grades",
  (p: { name: string; id_level: number }) => GradeAdminService.create(p),
  "Grado creado.",
)
export const useUpdateGrade = mutationFactory(
  "grades",
  (v: { id: number; name: string; id_level: number }) =>
    GradeAdminService.update(v.id, { name: v.name, id_level: v.id_level }),
  "Grado actualizado.",
)
export const useDeleteGrade = mutationFactory(
  "grades",
  (id: number) => GradeAdminService.remove(id),
  "Grado eliminado.",
)

// Subjects
export const useCreateSubject = mutationFactory(
  "subjects",
  (p: { name: string; technical: boolean }) => SubjectAdminService.create(p),
  "Materia creada.",
)
export const useUpdateSubject = mutationFactory(
  "subjects",
  (v: { id: string; name: string; technical: boolean }) =>
    SubjectAdminService.update(v.id, { name: v.name, technical: v.technical }),
  "Materia actualizada.",
)
export const useDeleteSubject = mutationFactory(
  "subjects",
  (id: string) => SubjectAdminService.remove(id),
  "Materia eliminada.",
)
