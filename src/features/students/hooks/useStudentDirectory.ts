import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query"
import { toast } from "sonner"

import type { PageQuery } from "@/lib/types/pagination"

import { StudentDirectoryService } from "../services/studentDirectoryService"
import { StudentService } from "../services/studentService"
import type { WithdrawStudentRequest } from "../models/requests/withdraw-request"
import type { StudentDirectoryFilters } from "../types"

const DIRECTORY_KEY = ["students", "directory"]

/**
 * El directorio institucional.
 *
 * `keepPreviousData` porque los filtros se tocan de a uno: sin esto la tabla parpadea a vacío entre
 * cada elección, y la persona no sabe si el filtro no encontró nada o todavía está buscando.
 */
export function useStudentDirectory(
  filters: StudentDirectoryFilters,
  query: PageQuery
) {
  return useQuery({
    queryKey: [...DIRECTORY_KEY, filters, query],
    queryFn: () => StudentDirectoryService.search(filters, query),
    placeholderData: keepPreviousData,
  })
}

/**
 * La baja, desde donde se la decide.
 *
 * Invalida el directorio entero y no la fila: una baja cambia el estado del estudiante y cierra sus
 * inscripciones, así que también cambia de qué listados desaparece.
 */
export function useWithdrawStudent() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (v: { id: string; payload: WithdrawStudentRequest }) =>
      StudentService.withdraw(v.id, v.payload),
    onSuccess: (_data, v) => {
      toast.success("Estudiante dado de baja.")
      void qc.invalidateQueries({ queryKey: DIRECTORY_KEY })
      void qc.invalidateQueries({ queryKey: ["students", v.id] })
      // El padrón del docente y el curso muestran al mismo estudiante desde otra consulta.
      void qc.invalidateQueries({ queryKey: ["courses"] })
    },
  })
}
