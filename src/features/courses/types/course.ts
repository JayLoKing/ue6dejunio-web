export interface Course {
  id: string
  gradeId: number
  gradeName: string
  parallelId: number
  parallelName: string
  academicYearId: number
  year: number
  homeroomTeacherId: string | null
  homeroomTeacherName: string | null
  active: boolean
}

export interface CourseStudent {
  courseEnrollmentId: string
  studentId: string
  rudeCode: string
  identityCard: string
  fullName: string
  status: string
}

export interface SubjectAssignment {
  id_subject: string
  id_teacher: string
}

/** POST /courses: crea curso + class_groups en 1 transaccion (anio auto). */
export interface CreateCoursePayload {
  id_grade: number
  id_parallel: number
  id_homeroom_teacher?: string
  assignments: SubjectAssignment[]
}

/** Respuesta de POST /courses. */
export interface CourseWithSubjects {
  course: Course
  classGroups: ClassGroupItem[]
}


/** ClassGroup = materia dentro de un curso. */
export interface ClassGroupItem {
  id: string
  courseId: string
  gradeName: string
  parallelName: string
  subjectId: string
  subjectName: string
  teacherId: string
  teacherName: string
  active: boolean
}

// Materias tecnicas (marcado visual). Ajustar nombres si el backend cambia.
const TECHNICAL_SUBJECTS = ["religion", "musica", "música", "educacion musical"]

export const isTechnicalSubject = (subjectName: string): boolean => {
  const n = subjectName.toLowerCase()
  return TECHNICAL_SUBJECTS.some((t) => n.includes(t))
}
