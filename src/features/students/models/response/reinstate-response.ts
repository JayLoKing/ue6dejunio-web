export interface ReinstateStudentResponse {
  studentId: string
  status: string
  courseId: string
  /** Verdadero si se reabrió una matrícula retirada; falso si se creó una nueva. */
  enrollmentReactivated: boolean
}
