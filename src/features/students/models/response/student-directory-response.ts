/**
 * Una fila del directorio institucional.
 *
 * Todo lo que viene del curso puede faltar: un estudiante registrado y todavía sin inscribir no
 * pertenece a ninguna gestión, y aparece igual porque es trabajo pendiente de secretaría.
 */
export interface StudentDirectoryResponse {
  id: string
  /** Null en quien se inscribió sólo con el nombre (la planilla de la escuela). */
  rudeCode: string | null
  identityCard: string | null
  fullName: string
  grade: string | null
  parallel: string | null
  level: string | null
  /** "Effective" o "Withdrawn", en las palabras del backend. */
  status: string
  /** El año del que son ciertos el grado y el paralelo de arriba. */
  academicYear: number | null
  /** El curso de la fila, para abrir su cuaderno. Nulo en quien no está inscrito. */
  courseId: string | null
  /** El paralelo de ese curso, que la ruta del cuaderno lleva en la URL. */
  parallelId: number | null
  /** Le falta RUDE, carnet, fecha de nacimiento o género. */
  incomplete: boolean
}
