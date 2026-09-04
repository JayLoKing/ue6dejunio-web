export type Gender = "M" | "F"

export interface StudentPayload {
  rudeCode: string
  identityCard: string
  names: string
  lastNames: string
  birthDate: string
  gender: Gender
}

export interface ParsedStudentRow extends StudentPayload {
  rowIndex: number
  rawFullName: string
  fullName: string
}

/** Un estudiante como lo muestra el padrón: lo justo para una fila de la tabla. */
export interface StudentRow {
  courseEnrollmentId: string
  /** El estudiante, no su inscripción: es por quien se pregunta al abrir el motivo de la baja. */
  studentId: string
  rudeCode: string
  identityCard: string
  fullName: string
  status: string
}

/**
 * La ficha del estudiante, con lo que dice su último cambio de estado.
 *
 * Sólo se pide al abrir el detalle: el padrón muestra el estado, no la explicación, y traer el
 * motivo de cada fila sería cargar en cada listado algo que casi nadie va a leer.
 */
export interface StudentDetail {
  id: string
  rudeCode: string
  identityCard: string
  names: string
  lastNames: string
  status: string
  /** La categoría: "Retiro Voluntario", "Transferencia" u "Otro". */
  statusReason: string | null
  /** Lo que escribió el Director, cuando la categoría no alcanzaba. */
  statusNote: string | null
  statusChangedAt: string | null
  statusChangedById: string | null
  statusChangedByName: string | null
}

/** Qué estudiantes pide el directorio. Sin elegir, los que siguen en el padrón. */
export type StudentDirectoryScope = "ACTIVE" | "WITHDRAWN" | "ALL"

/**
 * Lo que la persona eligió en los filtros del directorio.
 *
 * `academicYearId` en null significa "no elegí ninguna", y el backend responde por la gestión
 * actual. No existe "todas": una vista que junta todas las gestiones muestra al mismo estudiante
 * una vez por año cursado.
 */
export interface StudentDirectoryFilters {
  q: string
  gradeId: number | null
  parallelId: number | null
  academicYearId: number | null
  /**
   * Acota a un curso. No es un filtro que se elija: lo fija la pantalla que pregunta desde adentro
   * de un curso. Un curso pertenece a una sola gestión, así que además la fija.
   */
  courseId: string | null
  scope: StudentDirectoryScope
}

export const EMPTY_DIRECTORY_FILTERS: StudentDirectoryFilters = {
  q: "",
  gradeId: null,
  parallelId: null,
  academicYearId: null,
  courseId: null,
  scope: "ACTIVE",
}

/**
 * Los tres motivos de baja que acepta el backend, en las palabras que guarda.
 *
 * `needsItsOwnWords` es el espejo del enum de la API: "Otro" es la categoría para un motivo que
 * esta lista no tiene, así que sola no dice nada y la nota pasa a ser obligatoria.
 */
export const WITHDRAWAL_REASONS = [
  "Retiro Voluntario",
  "Transferencia",
  "Otro",
] as const

export type WithdrawalReason = (typeof WITHDRAWAL_REASONS)[number]

export const REASON_NEEDS_NOTE: WithdrawalReason = "Otro"

/** Una materia que dicta el docente, con el paralelo en el que la dicta. */
export interface TeacherSubject {
  subjectId: string
  subjectName: string
  classGroupId: string
}
