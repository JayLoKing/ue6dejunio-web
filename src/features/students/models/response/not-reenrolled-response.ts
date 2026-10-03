/** Una gestión por su id y su año calendario. */
export interface AcademicYearRef {
  id: number
  year: number
}

/** El curso en el que el estudiante tuvo matrícula efectiva en la gestión anterior. */
export interface LastCourse {
  id: string
  name: string
  grade: string
  parallel: string
}

export interface NotReenrolledStudent {
  studentId: string
  rudeCode: string
  identityCard: string
  fullName: string
  /** "Effective" o "Withdrawn": un retirado también puede no haber vuelto. */
  status: string
  lastCourse: LastCourse
}

/**
 * Quienes cursaron la gestión anterior y no tienen cupo en la consultada (GET
 * /students/not-reenrolled). Sólo Dirección y Secretaría.
 *
 * `previousYear` en null es "no hay gestión anterior registrada", y `students` viene vacío: no es
 * lo mismo que una lista vacía donde todos volvieron.
 */
export interface NotReenrolledResponse {
  academicYear: AcademicYearRef
  previousYear: AcademicYearRef | null
  students: NotReenrolledStudent[]
}
