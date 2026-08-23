export type Dimension = "Being" | "Knowing" | "Doing" | "Deciding"

export interface DimensionColor {
  /** Fondo suave + texto, legible en claro y oscuro. */
  soft: string
  /** Barra/acento sólido. */
  bar: string
  /** Borde tenue del color. */
  border: string
}

export interface DimensionMeta {
  key: Dimension
  label: string
  short: string
  /** Tope de la dimension: nota maxima de cada casilla y del promedio. */
  weight: number
  /** Color distintivo por dimension (claro/oscuro). */
  color: DimensionColor
}

// Ponderacion RM 0001/2026. Being=SER, Knowing=SABER, Doing=HACER, Deciding=AUTOEVALUACION.
export const DIMENSIONS: DimensionMeta[] = [
  {
    key: "Being",
    label: "SER",
    short: "SER",
    weight: 10,
    color: {
      soft: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
      bar: "bg-emerald-500",
      border: "border-emerald-500/30",
    },
  },
  {
    key: "Knowing",
    label: "SABER",
    short: "SABER",
    weight: 45,
    color: {
      soft: "bg-sky-500/10 text-sky-700 dark:text-sky-300",
      bar: "bg-sky-500",
      border: "border-sky-500/30",
    },
  },
  {
    key: "Doing",
    label: "HACER",
    short: "HACER",
    weight: 40,
    color: {
      soft: "bg-violet-500/10 text-violet-700 dark:text-violet-300",
      bar: "bg-violet-500",
      border: "border-violet-500/30",
    },
  },
  {
    key: "Deciding",
    label: "AUTOEVALUACIÓN",
    short: "AUTO",
    weight: 5,
    color: {
      soft: "bg-rose-500/10 text-rose-700 dark:text-rose-300",
      bar: "bg-rose-500",
      border: "border-rose-500/30",
    },
  },
]

export const dimensionMeta = (key: string): DimensionMeta =>
  DIMENSIONS.find((d) => d.key === key) ?? DIMENSIONS[0]

/** Criterio de evaluacion (solo nombre) por materia+trimestre+dimension. */
export interface Criterion {
  id: string
  classGroupId: string
  trimester: number
  dimension: Dimension
  name: string
  curriculumPlanId: string | null
}

export interface CreateCriterionPayload {
  id_class_group: string
  trimester: number
  dimension: Dimension
  name: string
  id_curriculum_plan?: string
}

export interface UpdateCriterionPayload {
  name?: string
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
  /** Fecha de registro y de ultima edicion (ISO-8601 del backend). */
  recordedAt: string | null
  updatedAt: string | null
}

export interface SetScorePayload {
  id_course_enrollment: string
  id_assessment_event: string
  score: number
}
