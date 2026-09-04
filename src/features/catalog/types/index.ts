export interface GradeItem {
  id: number
  name: string
  level: string
}

export interface ParallelItem {
  id: number
  name: string
}

export interface SubjectItem {
  id: string
  name: string
  technical: boolean
}

export interface TeacherItem {
  id: string
  fullName: string
  email: string
  technical: boolean
}

/**
 * Una gestión. `id` es lo que se manda como filtro; `year` es lo que se le muestra a la persona.
 */
export interface AcademicYearItem {
  id: number
  year: number
}

/** Trimestre configurado (catálogo): 1|2|3 + rango de fechas. */
export interface TrimesterItem {
  id: string
  trimester: number
  startDate: string
  endDate: string
}
