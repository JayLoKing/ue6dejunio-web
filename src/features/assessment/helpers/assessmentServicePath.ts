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
  ById: (id: string) => `/assessment-scores/${id}`,
} as const
