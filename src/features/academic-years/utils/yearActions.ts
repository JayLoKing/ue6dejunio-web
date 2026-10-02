import type { AcademicYearItem } from "@/features/catalog/types"

/** A closed year is never active, and the API refuses to activate it. */
export const canActivate = (year: AcademicYearItem): boolean =>
  !year.active && !year.closed

/** Any year that is not closed yet, the active one included. */
export const canClose = (year: AcademicYearItem): boolean => !year.closed

/** Reopening does not reactivate: it only lets the year take writes again. */
export const canReopen = (year: AcademicYearItem): boolean => year.closed

/** The target must be open: the API refuses to write into a closed year. */
export const canDuplicate = (year: AcademicYearItem): boolean => !year.closed

/**
 * The year to copy from when the dialog opens: the active one, unless it is the target, then the
 * newest of the others. Undefined when the target is the only year there is.
 */
export function defaultSourceYear(
  years: readonly AcademicYearItem[] | undefined,
  target: AcademicYearItem
): AcademicYearItem | undefined {
  const others = (years ?? []).filter((y) => y.id !== target.id)
  return (
    others.find((y) => y.active) ??
    others.reduce<AcademicYearItem | undefined>(
      (newest, y) =>
        newest === undefined || y.year > newest.year ? y : newest,
      undefined
    )
  )
}
