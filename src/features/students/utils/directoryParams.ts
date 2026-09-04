import type { StudentDirectoryFilters } from "../types"

/**
 * Traduce lo elegido en los filtros a los parámetros que entiende `GET /api/students/search`.
 *
 * Un filtro sin elegir se **omite**, no se manda vacío. Importa sobre todo en la gestión: el
 * backend responde por la gestión actual justamente cuando el parámetro no viene, así que mandar
 * `academicYearId=` no sería "sin filtro", sería una consulta distinta.
 */
export function toDirectoryParams(
  filters: StudentDirectoryFilters
): Record<string, unknown> {
  const params: Record<string, unknown> = { scope: filters.scope }

  const q = filters.q.trim()
  if (q) params.q = q
  if (filters.gradeId !== null) params.gradeId = filters.gradeId
  if (filters.parallelId !== null) params.parallelId = filters.parallelId
  if (filters.academicYearId !== null) {
    params.academicYearId = filters.academicYearId
  }
  if (filters.courseId !== null) params.courseId = filters.courseId

  return params
}
