/** Lo elegido para una materia en el formulario de alta de curso. */
export interface SubjectTeacherChoice {
  teacherId: string | null
  /** Sólo se mira en las técnicas: la dicta el docente de aula del curso. */
  byHomeroom: boolean
}

/**
 * Quién queda al frente de una materia.
 *
 * Tres reglas, y ninguna es la misma:
 * - **Técnica marcada como "la dicta el de aula"**: el encargado del curso. Los docentes técnicos
 *   no alcanzan para todos los cursos, y la escuela llena el hueco así.
 * - **Técnica sin marcar**: el técnico elegido, y nadie por defecto. Cuando hay un técnico libre es
 *   a quien corresponde, así que se elige a mano en vez de caer en el de aula sin querer.
 * - **De aula**: quien se haya elegido, y si no el docente de aula del curso.
 *
 * `undefined` significa que la materia todavía no tiene a nadie y no se puede guardar así.
 */
export function resolveSubjectTeacher(
  technical: boolean,
  choice: SubjectTeacherChoice | undefined,
  homeroomTeacherId: string | undefined
): string | undefined {
  if (technical) {
    if (choice?.byHomeroom) return homeroomTeacherId
    return choice?.teacherId ?? undefined
  }
  return choice?.teacherId ?? homeroomTeacherId
}
