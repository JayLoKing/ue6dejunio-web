import { useAcademicYears } from "@/features/catalog/hooks/useCatalog"
import { activeAcademicYear } from "@/features/catalog/utils/activeAcademicYear"

import { useCoursesOfYear } from "./useCourses"

/**
 * Los cursos de la gestión activa, para las pantallas que no tienen un selector de gestión propio.
 *
 * Con dos gestiones en la base, una lista sin año mezcla los cursos de ambas y el selector de curso
 * ofrece "Primero A" dos veces. La que se lee es la activa (`activeAcademicYear`), no la más
 * reciente.
 *
 * `isLoading` incluye la lista de gestiones: hasta que se sabe cuál es la activa no hay consulta de
 * cursos, y sin esto la pantalla afirmaría "no hay cursos" mientras todavía lo averigua. Una falla
 * de cualquiera de las dos es `isError`, no una lista vacía. Sin ninguna gestión activa no hay
 * cursos ni error: `academicYearId` en null lo dice.
 */
export function useActiveYearCourses() {
  const years = useAcademicYears()
  const academicYearId = activeAcademicYear(years.data)?.id ?? null
  const courses = useCoursesOfYear(academicYearId)

  return {
    data: courses.data,
    academicYearId,
    isLoading: years.isLoading || courses.isLoading,
    isError: years.isError || courses.isError,
  }
}
