export interface StudentSubjectTotal {
  classGroupId: string
  subjectName: string
  total: number
  graded: boolean
}

export interface StudentSummary {
  courseEnrollmentId: string
  studentId: string
  fullName: string
  trimester: number
  subjects: StudentSubjectTotal[]
  generalAverage: number
}

/**
 * Un área de conocimiento a lo largo de todo el año. Un trimestre en null significa que el área
 * no tiene fila ahí: nunca calificada, que no es lo mismo que un cero. `average` promedia sólo
 * los trimestres en que sí fue calificada.
 */
export interface AnnualSubjectTotal {
  classGroupId: string
  subjectName: string
  trimester1: number | null
  trimester2: number | null
  trimester3: number | null
  average: number | null
}

/**
 * El año de un estudiante (GET /gradebook/annual-centralizer). Alimenta las tres hojas de cierre:
 * la matriz por área, los promedios por trimestre y el ranking ordenado por `finalAverage`.
 *
 * `trimesterAverages` es siempre de tres posiciones, indexada por trimestre; una posición en null
 * significa que el estudiante no tiene nada calificado ese trimestre. La tupla lo deja fijado en
 * el tipo en vez de en un comentario que nadie compila.
 */
export interface StudentAnnualSummary {
  courseEnrollmentId: string
  studentId: string
  fullName: string
  subjects: AnnualSubjectTotal[]
  trimesterAverages: [number | null, number | null, number | null]
  finalAverage: number | null
}

/** Un área curricular de la libreta. Un trimestre en null es "nunca calificada", no un cero. */
export interface ReportCardArea {
  classGroupId: string
  subjectName: string
  trimester1: number | null
  trimester2: number | null
  trimester3: number | null
  average: number | null
}

/**
 * Un campo de saberes con sus áreas. `fieldName` viene en null cuando el área quedó sin campo
 * porque su materia se desactivó: sus notas se imprimen igual, en una fila al final, porque esas
 * notas se pusieron.
 */
export interface ReportCardField {
  fieldName: string | null
  displayOrder: number | null
  areas: ReportCardArea[]
}

/**
 * Áreas aprobadas y reprobadas de un trimestre. **No tienen por qué sumar el total de áreas**: una
 * sin nota ese trimestre no cuenta en ninguna de las dos, porque nadie la calificó.
 */
export interface ReportCardOutcome {
  trimester: number
  passedAreas: number
  failedAreas: number
}

/**
 * La libreta de un estudiante (GET /gradebook/report-card).
 *
 * El encabezado de la escuela no viene acá: es idéntico en toda libreta y se lee una vez de
 * `/institution`.
 */
export interface StudentReportCard {
  courseEnrollmentId: string
  studentId: string
  rudeCode: string
  fullName: string
  gradeName: string
  parallelName: string
  year: number
  fields: ReportCardField[]
  trimesterAverages: [number | null, number | null, number | null]
  finalAverage: number | null
  /** El promedio anual escrito en palabras. Vacío cuando no hay nada calificado. */
  finalAverageInWords: string
  trimesterOutcomes: ReportCardOutcome[]
}

export interface CourseAttendanceItem {
  id: string
  date: string
  status: string
}

/** Consolidado por dimensión de una materia (GET /scores?id_course_enrollment). */
export interface EnrollmentScore {
  id: string
  courseEnrollmentId: string
  classGroupId: string
  subjectName: string
  trimester: number
  scoreBeing: number | null
  scoreKnowing: number | null
  scoreDoing: number | null
  scoreDeciding: number | null
  totalScore: number | null
  updatedAt: string | null
}

/** Conteos de asistencia. percentage = present/(present+absent+late); null si no computable. */
export interface AttendanceCounts {
  present: number
  absent: number
  late: number
  excused: number
  computableSessions: number
  percentage: number | null
}

export interface MonthlyAttendanceStat extends AttendanceCounts {
  year: number
  month: number
}

export interface TrimesterAttendanceStat extends AttendanceCounts {
  trimester: number
}

/** GET /courses/{id}/attendance-stats — % de asistencia diaria del curso. */
export interface CourseAttendanceStats {
  courseId: string
  scope: string
  trimester: number | null
  overall: AttendanceCounts
  byMonth: MonthlyAttendanceStat[]
  byTrimester: TrimesterAttendanceStat[]
}

export interface CourseAttendanceRow {
  courseEnrollmentId: string
  studentId: string
  fullName: string
  attendances: CourseAttendanceItem[]
}
