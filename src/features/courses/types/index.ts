export interface SubjectAssignment {
  id_subject: string
  id_teacher: string
}

export interface ClassGroupItem {
  id: string
  subjectId: string
  subjectName: string
  teacherId: string
  teacherName: string
  gradeId: number
  gradeName: string
  parallelId: number
  parallelName: string
  academicYearId: number
  year: number
}
