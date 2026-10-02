import { useMutation, useQueryClient } from "@tanstack/react-query"
import type { QueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import { catalogKeys } from "@/features/catalog/hooks/useCatalog"
import type { AcademicYearItem } from "@/features/catalog/types"
import { invalidateCourses } from "@/features/courses/hooks/useCourses"

import { AcademicYearService } from "../services/academicYearService"
import type { CreatedAcademicYear } from "../types"

/**
 * Every transition can change which year is "the current one" or whether it accepts writes, so all
 * of them leave the same things stale: the year list, the trimesters and student movement of the
 * current year (keyed "current"), and the courses, which mirror the year.
 */
function invalidateAfterYearChange(qc: QueryClient) {
  void qc.invalidateQueries({ queryKey: catalogKeys.academicYears })
  void qc.invalidateQueries({ queryKey: ["catalog", "trimesters"] })
  void qc.invalidateQueries({ queryKey: ["students", "movement-summary"] })
  invalidateCourses(qc)
}

// A refusal (409 closed year, 403) is toasted by the axios interceptor; no onError here.
function useYearTransition(
  mutationFn: (id: number) => Promise<AcademicYearItem>,
  successMessage: string
) {
  const qc = useQueryClient()
  return useMutation<AcademicYearItem, Error, number>({
    mutationFn,
    onSuccess: () => {
      toast.success(successMessage)
      invalidateAfterYearChange(qc)
    },
  })
}

/**
 * Opens a year. The API answers 200 for one that already exists, so the toast says which of the
 * two happened. Only the year list goes stale: a new year has no courses, trimesters or movement.
 */
export function useCreateAcademicYear() {
  const qc = useQueryClient()
  return useMutation<CreatedAcademicYear, Error, number>({
    mutationFn: (year) => AcademicYearService.create(year),
    onSuccess: ({ year, created }) => {
      toast.success(
        created
          ? `Gestión ${year.year} creada.`
          : `La gestión ${year.year} ya existía.`
      )
      void qc.invalidateQueries({ queryKey: catalogKeys.academicYears })
    },
  })
}

export const useActivateAcademicYear = () =>
  useYearTransition(
    (id) => AcademicYearService.activate(id),
    "Gestión activada."
  )

export const useCloseAcademicYear = () =>
  useYearTransition((id) => AcademicYearService.close(id), "Gestión cerrada.")

export const useReopenAcademicYear = () =>
  useYearTransition(
    (id) => AcademicYearService.reopen(id),
    "Gestión reabierta."
  )
