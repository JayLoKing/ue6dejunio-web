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

/** Una materia que dicta el docente, con el paralelo en el que la dicta. */
export interface TeacherSubject {
  subjectId: string
  subjectName: string
  classGroupId: string
}
