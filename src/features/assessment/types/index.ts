export type Dimension = "Being" | "Knowing" | "Doing" | "Deciding"

export interface DimensionMeta {
  key: Dimension
  label: string
  short: string
  /** Tope de la dimension (suma de pesos de sus criterios no debe exceder). */
  weight: number
}

// Ponderacion RM 0001/2026. Being=SER, Knowing=SABER, Doing=HACER, Deciding=AUTO/DECIDIR.
export const DIMENSIONS: DimensionMeta[] = [
  { key: "Being", label: "SER", short: "SER", weight: 10 },
  { key: "Knowing", label: "SABER", short: "SABER", weight: 45 },
  { key: "Doing", label: "HACER", short: "HACER", weight: 40 },
  { key: "Deciding", label: "DECIDIR", short: "AUTO", weight: 5 },
]

export const dimensionMeta = (key: string): DimensionMeta =>
  DIMENSIONS.find((d) => d.key === key) ?? DIMENSIONS[0]

/** Criterio de evaluacion (con peso) por materia+trimestre+dimension. */
export interface Criterion {
  id: string
  classGroupId: string
  trimester: number
  dimension: Dimension
  name: string
  maxWeight: number
  curriculumPlanId: string | null
}

export interface CreateCriterionPayload {
  id_class_group: string
  trimester: number
  dimension: Dimension
  name: string
  maxWeight: number
  id_curriculum_plan?: string
}

export interface UpdateCriterionPayload {
  name?: string
  maxWeight?: number
}

/** Actividad bajo un criterio. */
export interface AssessmentEvent {
  id: string
  criterionId: string
  classGroupId: string
  trimester: number
  dimension: Dimension
  title: string
  description: string | null
  maxScore: number
}

export interface CreateEventPayload {
  id_criterion: string
  title: string
  description?: string
  maxScore?: number
}

export interface UpdateEventPayload {
  title?: string
  description?: string
  maxScore?: number
}

/** Nota por (course_enrollment, actividad). */
export interface AssessmentScore {
  id: string
  courseEnrollmentId: string
  eventId: string
  score: number
}

export interface SetScorePayload {
  id_course_enrollment: string
  id_assessment_event: string
  score: number
}
