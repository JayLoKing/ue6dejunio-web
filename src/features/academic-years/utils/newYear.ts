import type { AcademicYearItem } from "@/features/catalog/types"

/** The range the API accepts for a calendar year. */
export const MIN_YEAR = 2000
export const MAX_YEAR = 2100

/**
 * The year to offer when opening a new one: the one after the latest on record, wherever it sits
 * in the list. With none on record, the calendar year the Director is in.
 */
export function suggestNextYear(
  years: readonly AcademicYearItem[] | undefined,
  currentCalendarYear: number = new Date().getFullYear()
): number {
  if (!years || years.length === 0) return currentCalendarYear
  return Math.max(...years.map((y) => y.year)) + 1
}

/** Why the typed text cannot be a year to create, or null when it can. */
export function yearInputError(text: string): string | null {
  const trimmed = text.trim()
  if (trimmed === "") return "Escribe el año de la gestión."
  if (!/^\d+$/.test(trimmed)) return "El año debe ser un número entero."
  const value = Number(trimmed)
  if (value < MIN_YEAR) return `El año no puede ser anterior a ${MIN_YEAR}.`
  if (value > MAX_YEAR) return `El año no puede ser posterior a ${MAX_YEAR}.`
  return null
}
