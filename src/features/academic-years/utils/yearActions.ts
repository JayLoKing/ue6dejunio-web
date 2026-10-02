import type { AcademicYearItem } from "@/features/catalog/types"

/** A closed year is never active, and the API refuses to activate it. */
export const canActivate = (year: AcademicYearItem): boolean =>
  !year.active && !year.closed

/** Any year that is not closed yet, the active one included. */
export const canClose = (year: AcademicYearItem): boolean => !year.closed

/** Reopening does not reactivate: it only lets the year take writes again. */
export const canReopen = (year: AcademicYearItem): boolean => year.closed
