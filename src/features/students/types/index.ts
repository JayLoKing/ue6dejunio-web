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
  rudeCode: string
  identityCard: string
  fullName: string
  status: string
}

/** Una materia que dicta el docente, con el paralelo en el que la dicta. */
export interface TeacherSubject {
  subjectId: string
  subjectName: string
  classGroupId: string
}
