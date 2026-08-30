export type PdcStatus =
  | "Draft"
  | "Published"
  | "Under Review"
  | "With Observations"
  | "Approved"

/** One week's row of a subject's table. */
export interface PdcEntry {
  id: string
  weekLabel: string
  contents: string | null
  practice: string | null
  theory: string | null
  valuation: string | null
  production: string | null
  resources: string | null
  periods: number | null
  criteriaBeing: string | null
  criteriaKnowing: string | null
  criteriaDoing: string | null
  displayOrder: number
}

/** One subject's block: opened with the plan, filled in its own step of the form. */
export interface PdcSubject {
  id: string
  classGroupId: string
  subjectName: string
  knowledgeArea: string | null
  teacherId: string | null
  teacherName: string | null
  learningObjective: string | null
  generalAdaptations: string | null
  displayOrder: number
  entries: PdcEntry[]
}

/**
 * One month's plan for a course. The heading is shared by every subject, which is why the form
 * asks for it once and then walks the blocks.
 */
export interface Pdc {
  id: string
  courseId: string
  courseName: string | null
  gradeName: string | null
  parallelName: string | null
  /** "Primaria Comunitaria Vocacional" — the "Nivel" row of the form. */
  levelName: string | null
  homeroomTeacherId: string | null
  homeroomTeacherName: string | null
  planNumber: number
  trimester: number
  periodStart: string
  periodEnd: string
  status: PdcStatus
  reviewObservations: string | null
  holisticObjective: string | null
  finalProduct: string | null
  bibliography: string | null
  sourcePlanId: string | null
  subjects: PdcSubject[]
  createdById: string | null
  updatedById: string | null
  updatedByName: string | null
  createdAt: string
  updatedAt: string
}

/** Opens the plan. Omitting the class groups plans every subject of the course. */
export interface CreatePdcPayload {
  id_course: string
  plan_number: number
  trimester: number
  period_start: string
  period_end: string
  holisticObjective?: string
  finalProduct?: string
  bibliography?: string
  id_class_groups?: string[]
}

/** Every field optional: each step of the form saves only what that step holds. */
export interface UpdatePdcPayload {
  plan_number?: number
  period_start?: string
  period_end?: string
  holisticObjective?: string
  finalProduct?: string
  bibliography?: string
}

export interface PdcEntryPayload {
  weekLabel: string
  contents?: string
  practice?: string
  theory?: string
  valuation?: string
  production?: string
  resources?: string
  periods?: number
  criteriaBeing?: string
  criteriaKnowing?: string
  criteriaDoing?: string
}

/** Writes a subject's block whole: the rows sent replace the rows held. */
export interface UpsertPdcSubjectPayload {
  learningObjective?: string
  generalAdaptations?: string
  entries: PdcEntryPayload[]
}

export interface PdcProgress {
  id: string
  planId: string
  progressDate: string | null
  advancedContent: string | null
  percentage: number | null
  observations: string | null
  createdBy: string
  createdAt: string
}

export interface AddProgressPayload {
  progressDate?: string
  advancedContent?: string
  percentage?: number
  observations?: string
}
