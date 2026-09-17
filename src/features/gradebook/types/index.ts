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

/**
 * Un lugar del cuadro de honor: quién lo ocupa, de qué aula viene y el promedio que se lo ganó.
 *
 * `finalAverage` nunca es null, a diferencia del resumen anual de arriba: el estudiante sin nada
 * calificado no ocupa lugar alguno, porque no fue juzgado. El promedio es el mismo que imprime la
 * libreta — el podio no lo recalcula, o terminaría discrepando de la hoja que la escuela ya firmó.
 *
 * El curso viaja con cada entrada aun en el podio de un solo curso: el lector de la lista
 * institucional lo necesita para distinguir dos estudiantes del mismo nombre, y un payload que
 * cambia de forma según el alcance es un payload que cada pantalla tiene que ramificar.
 *
 * @see HonorRollEntryResponse del lado de la API
 */
export interface HonorRollEntry {
  /** El lugar en el podio, empezando en uno. */
  position: number
  courseEnrollmentId: string
  studentId: string
  fullName: string
  courseId: string
  gradeName: string
  parallelName: string
  finalAverage: number
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

/** Una columna `V | M | T | %` de la sección III. `percentage` en null: no hay efectivos. */
export interface GenderTally {
  male: number
  female: number
  total: number
  percentage: number | null
}

/**
 * Los tres conteos del informe. **No tienen por qué cerrar entre sí**: un estudiante que nadie
 * calificó es efectivo y no está ni aprobado ni reprobado, y `male + female` puede quedar por
 * debajo de `total` porque el género de un estudiante puede no estar registrado.
 */
export interface PedagogicalReportStats {
  effective: GenderTally
  passed: GenderTally
  failed: GenderTally
}

/** Un área reprobada con la nota que la reprobó. Van apiladas en una sola celda del cuadro IV. */
export interface FailedArea {
  classGroupId: string
  subjectName: string
  mark: number
}

/** Una fila del cuadro IV. `actions` y `verificationSource` los escribe el docente. */
export interface FailingStudentRow {
  number: number
  courseEnrollmentId: string
  studentId: string
  fullName: string
  failedAreas: FailedArea[]
  actions: string | null
  verificationSource: string | null
}

/**
 * El informe pedagógico de un curso en un trimestre (GET /gradebook/pedagogical-report).
 *
 * El encabezado de la escuela no viene acá, igual que en la libreta: es idéntico en todo documento
 * y se lee una vez de `/institution`.
 *
 * `exists` en false es la hoja que todavía nadie escribió. Llega igual de completa — las secciones
 * I, III y IV se derivan de la nómina y de las notas — y sólo la prosa viene vacía.
 */
export interface PedagogicalReport {
  courseId: string
  gradeName: string
  parallelName: string
  year: number
  homeroomTeacherName: string | null
  trimester: number
  exists: boolean
  achievements: string | null
  difficulties: string | null
  stats: PedagogicalReportStats
  failingStudents: FailingStudentRow[]
  updatedAt: string | null
}

/** Lo que el docente escribe de un estudiante reprobado. */
export interface FailingStudentNotePayload {
  idCourseEnrollment: string
  actions: string | null
  verificationSource: string | null
}

/**
 * El PUT del informe. Reemplaza el documento entero.
 *
 * **Omitir `failingStudents` deja la sección IV como estaba; mandar `[]` la vacía.** No son lo
 * mismo, y la diferencia importa: esos párrafos son prosa que un docente tipeó y de la que el
 * sistema no guarda una segunda copia.
 */
export interface SavePedagogicalReportPayload {
  achievements: string | null
  difficulties: string | null
  failingStudents?: FailingStudentNotePayload[]
}
