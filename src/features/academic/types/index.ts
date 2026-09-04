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

/**
 * Un área de saberes: agrupa a las materias.
 *
 * `displayOrder` es el lugar que ocupa en el plan impreso. Se decide al crearla y casi nunca se
 * toca, así que el formulario lo deja opcional y la API la manda al final.
 */
export interface KnowledgeArea {
  id: number
  name: string
  displayOrder: number
}

export interface Subject {
  id: string
  name: string
  /** El área a la que pertenece. Obligatoria: el plan agrupa las materias por área. */
  areaId: number
  areaName: string
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
