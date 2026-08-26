export const CriterionUrl = {
  Base: "/criteria",
  ById: (id: string) => `/criteria/${id}`,
} as const

export const AssessmentEventUrl = {
  Base: "/assessment-events",
  ById: (id: string) => `/assessment-events/${id}`,
} as const

export const AssessmentScoreUrl = {
  Base: "/assessment-scores",
  ByEvent: (eventId: string) => `/assessment-scores/event/${eventId}`,
  /** Notas directas de un criterio (el que no tiene actividad). */
  ByCriterion: (criterionId: string) =>
    `/assessment-scores/criterion/${criterionId}`,
  ById: (id: string) => `/assessment-scores/${id}`,
} as const
