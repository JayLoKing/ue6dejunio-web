/**
 * Una fila del directorio institucional.
 *
 * Todo lo que viene del curso puede faltar: un estudiante registrado y todavía sin inscribir no
 * pertenece a ninguna gestión, y aparece igual porque es trabajo pendiente de secretaría.
 */
export interface StudentDirectoryResponse {
  id: string
  rudeCode: string
  identityCard: string
  fullName: string
  grade: string | null
  parallel: string | null
  level: string | null
  /** "Effective" o "Withdrawn", en las palabras del backend. */
  status: string
  /** El año del que son ciertos el grado y el paralelo de arriba. */
  academicYear: number | null
}
