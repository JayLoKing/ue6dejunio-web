import type { Course } from "../types/course"

/**
 * Qué ya está ocupado en la gestión que se está armando, para que el alta de curso lo diga en vez
 * de dejar que el Director lo descubra apretando Guardar.
 *
 * Las dos reglas se acotan a UNA gestión. Un curso pertenece a una sola, así que el paralelo que
 * Primero usó en 2025 está libre en 2026, y haber sido docente de aula ese año no ocupa a nadie
 * este. Sin ese corte, cada año de uso deshabilitaría más opciones que el anterior hasta no dejar
 * ninguna.
 *
 * Con la gestión en `null` —todavía no se sabe cuál es— ninguna de las dos reclama nada: preferimos
 * no afirmar a afirmar de más. Quien las use tiene que esperar a saberlo antes de dejar elegir.
 */

/**
 * El curso que ya ocupa cada paralelo del grado dado, indexado por `parallelId`.
 *
 * Un curso desactivado también ocupa: el alta del backend pregunta por grado + paralelo + gestión y
 * no mira `active`, así que volver a crear Primero A choca igual contra el que está cerrado. Dejar
 * el paralelo libre acá sería ofrecer una opción que termina en 409. El listado del que salen estos
 * cursos tampoco filtra por `active`, así que el curso cerrado llega y se cuenta.
 */
export function takenParallels(
  courses: Course[],
  academicYearId: number | null,
  gradeId: number | undefined
): Map<number, Course> {
  const taken = new Map<number, Course>()
  if (academicYearId === null || gradeId === undefined) return taken
  for (const c of courses) {
    if (c.academicYearId !== academicYearId) continue
    if (c.gradeId !== gradeId) continue
    taken.set(c.parallelId, c)
  }
  return taken
}

/** El curso del que cada docente ya es encargado, indexado por `homeroomTeacherId`. */
export function homeroomCourses(
  courses: Course[],
  academicYearId: number | null
): Map<string, Course> {
  const byTeacher = new Map<string, Course>()
  if (academicYearId === null) return byTeacher
  for (const c of courses) {
    if (c.academicYearId !== academicYearId) continue
    if (c.homeroomTeacherId === null) continue
    byTeacher.set(c.homeroomTeacherId, c)
  }
  return byTeacher
}
