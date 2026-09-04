export const LevelUrl = {
  Base: "/levels",
  ById: (id: number) => `/levels/${id}`,
} as const

export const GradeUrl = {
  Base: "/grades",
  ById: (id: number) => `/grades/${id}`,
} as const

export const ParallelUrl = {
  Base: "/parallels",
  ById: (id: number) => `/parallels/${id}`,
} as const

export const KnowledgeAreaUrl = {
  Base: "/knowledge-areas",
  ById: (id: number) => `/knowledge-areas/${id}`,
} as const

export const SubjectUrl = {
  Base: "/subjects",
  ById: (id: string) => `/subjects/${id}`,
} as const

export const TrimesterPeriodUrl = {
  Base: "/trimester-periods",
  ById: (id: string) => `/trimester-periods/${id}`,
} as const
