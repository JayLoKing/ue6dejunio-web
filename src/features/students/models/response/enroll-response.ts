/** Un estudiante que la carga omitió porque está retirado. */
export interface SkippedStudent {
  studentId: string
  fullName: string
}

/**
 * El resultado de una inscripción, individual o por nómina.
 *
 * Invariante de la API: `studentsCreated + studentsFromPreviousYear + studentsReentering +
 * skippedWithdrawn.length` es la cantidad de estudiantes distintos de la carga. `studentsTotal`
 * cuenta filas, repetidas incluidas, así que no es esa suma.
 */
export interface EnrollResponse {
  studentsTotal: number
  studentsCreated: number
  studentsExisting: number
  studentsFromPreviousYear: number
  studentsReentering: number
  enrollmentsCreated: number
  enrollmentsSkipped: number
  /** Retirados: se omiten para todo el que carga; sólo el Director los reincorpora. */
  skippedWithdrawn: SkippedStudent[]
}
