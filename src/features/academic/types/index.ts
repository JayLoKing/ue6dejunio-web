export interface Level {
  id: number
  name: string
}

export interface Grade {
  id: number
  name: string
  levelId: number
  levelName: string
}

export interface Parallel {
  id: number
  name: string
}

export interface Subject {
  id: string
  name: string
  technical: boolean
  active: boolean
}

/** Periodo de trimestre configurado (fechas) de un año académico. */
export interface TrimesterPeriod {
  id: string
  academicYearId: number
  trimester: number
  startDate: string
  endDate: string
}

export interface CreateTrimesterPeriodPayload {
  id_academic_year: number
  trimester: number
  start_date: string
  end_date: string
}

export interface UpdateTrimesterPeriodPayload {
  start_date: string
  end_date: string
}
