/**
 * La reincorporación de un estudiante retirado.
 *
 * Sin `id_course` la API reabre la matrícula retirada de la gestión activa. Si no hay ninguna,
 * contesta 400 pidiendo un curso, y se reenvía con `id_course` de un curso de esa misma gestión.
 */
export interface ReinstateStudentRequest {
  id_course?: string
}

export interface ReinstateStudentResponse {
  studentId: string
  status: string
  courseId: string
  /** Verdadero si se reabrió una matrícula retirada; falso si se creó una nueva. */
  enrollmentReactivated: boolean
}
