import { isRole } from "@/features/auth/types"
import { EFFECTIVE } from "@/lib/enrollment"

/** Lo que dice la sesión de quien mira: lo justo para decidir si puede editar una ficha. */
export interface EditorSession {
  role: string | null
  /** El curso de aula del docente (claim del login); null para quien no lo tiene. */
  courseId: string | null
  isTechnical: boolean | null
}

/**
 * Si quien mira puede editar los datos del estudiante de una fila.
 *
 * Espejo de `canEditStudent` de la API, para no ofrecer un botón que termina en 403: el Director
 * edita a cualquiera; el docente de aula, sólo a quien sigue inscrito en su curso. La secretaría y
 * el docente técnico leen el padrón, no lo corrigen.
 *
 * @param courseId el curso de la fila (null si no está inscrito)
 * @param status el estado de la fila, en las palabras del backend
 */
export function canEditStudent(
  session: EditorSession,
  courseId: string | null,
  status: string
): boolean {
  if (isRole(session.role, "DIRECTOR")) return true
  return (
    isRole(session.role, "TEACHER") &&
    session.isTechnical !== true &&
    session.courseId !== null &&
    session.courseId === courseId &&
    status === EFFECTIVE
  )
}
