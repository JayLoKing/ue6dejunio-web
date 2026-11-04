/** Un estudiante que la carga omitió porque está retirado. */
export interface SkippedStudent {
  studentId: string
  fullName: string
}

/** Un retirado de una gestión anterior que la carga reincorporó e inscribió. */
export interface ReinstatedStudent {
  studentId: string
  fullName: string
}

/** Un estudiante omitido porque ya está inscrito en otro curso de la misma gestión. */
export interface EnrolledElsewhere {
  studentId: string
  rudeCode: string
  fullName: string
  /** El curso donde ya está: grado y paralelo. */
  courseLabel: string
}

/**
 * Una fila omitida: su RUDE y su CI son de dos estudiantes distintos, o su nombre coincide con más
 * de un estudiante del curso. Una fila de la planilla de la escuela no trae RUDE ni CI.
 */
export interface EnrollConflict {
  rudeCode: string | null
  identityCard: string | null
  /** El nombre tal como venía en la fila. */
  fullName: string
  /** De quién es cada dato, dicho por la API. */
  reason: string
}

/**
 * El resultado de una inscripción, individual o por nómina.
 *
 * Invariante de la API: `studentsCreated + studentsFromPreviousYear + studentsReentering +
 * reinstated.length + skippedWithdrawn.length + skippedOtherCourse.length` es la cantidad de
 * estudiantes distintos de la carga. Las filas de `conflicts` quedan fuera: no nombran a un solo
 * estudiante. `studentsTotal` cuenta filas, repetidas incluidas, así que no es esa suma.
 */
export interface EnrollResponse {
  studentsTotal: number
  studentsCreated: number
  studentsExisting: number
  studentsFromPreviousYear: number
  studentsReentering: number
  enrollmentsCreated: number
  enrollmentsSkipped: number
  /**
   * Estudiantes que ya estaban registrados con datos incompletos y a los que la carga les llenó lo
   * que faltaba (RUDE, carnet, fecha, género). Nunca se pisa un dato que ya tenían.
   */
  completed: number
  /** Retirados de una gestión anterior: la nómina de este año los trae de vuelta. */
  reinstated: ReinstatedStudent[]
  /** Retirados en esta gestión: se omiten para todo el que carga; sólo el Director los reincorpora. */
  skippedWithdrawn: SkippedStudent[]
  /** Ya inscritos en otro curso de esta gestión: no se les da un segundo lugar. */
  skippedOtherCourse: EnrolledElsewhere[]
  /** Filas que no se inscribieron: RUDE y CI de estudiantes distintos, o un nombre ambiguo. */
  conflicts: EnrollConflict[]
}
