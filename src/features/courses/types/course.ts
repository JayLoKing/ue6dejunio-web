import type { PagedResponse } from "@/lib/types/pagination"
import type { StudentSummary } from "@/features/gradebook/types"

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
  /**
   * Si la persona nombrada en `homeroomTeacherName` todavía puede iniciar sesión. Distinto de
   * `active`, que es si el curso (el aula) está abierto: un curso puede seguir activo con un
   * docente de aula dado de baja. Un curso sin docente de aula reporta `false` — no hay nadie
   * activo que bloquee la reasignación.
   */
  homeroomTeacherActive: boolean
}

export interface CourseStudent {
  courseEnrollmentId: string
  studentId: string
  rudeCode: string
  identityCard: string
  fullName: string
  status: string
  /** "M" | "F". El backend aún no lo expone en este listado (pendiente). */
  gender?: string | null
}

export interface SubjectAssignment {
  id_subject: string
  id_teacher: string
}

/** POST /courses: crea curso + class_groups en 1 transacción (año auto). */
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

/** GET /courses/{id}/overview: header + materias(docente) + estudiantes con totales. */
export interface CourseOverview {
  course: Course
  classGroups: ClassGroupItem[]
  students: PagedResponse<StudentSummary>
  /** Cuenta de matrículas activas por género, calculada en el backend (no por página). */
  males: number
  females: number
  /**
   * Los que están en el curso hoy. No es `students.total`, que conserva al retirado porque las
   * notas que sacó antes de irse siguen siendo del año. Este es el que va al lado de varones y
   * mujeres: los tres cuentan a la misma gente.
   */
  activeStudents: number
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
