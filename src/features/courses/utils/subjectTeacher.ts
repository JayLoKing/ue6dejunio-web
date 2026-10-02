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

export interface TeacherOption {
  id: string
  fullName: string
}

/**
 * A quién se le puede dar una materia ya creada.
 *
 * La misma regla del alta, vista desde la lista: una materia común es de un docente no técnico, y
 * una técnica es de un técnico o del docente de aula del curso (el hueco que la escuela llena así).
 * Sin docente de aula en el curso, la técnica sólo ofrece a los técnicos.
 */
export function eligibleSubjectTeachers(
  technical: boolean,
  teachers: {
    technicalTeachers: readonly TeacherOption[]
    aulaTeachers: readonly TeacherOption[]
    homeroomTeacherId: string | null | undefined
  }
): TeacherOption[] {
  if (!technical) return [...teachers.aulaTeachers]
  const homeroom = teachers.aulaTeachers.find(
    (t) => t.id === teachers.homeroomTeacherId
  )
  return homeroom
    ? [...teachers.technicalTeachers, homeroom]
    : [...teachers.technicalTeachers]
}
