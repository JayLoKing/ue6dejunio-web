/**
 * One student's significant adaptation inside a plan. The server keeps it unique per plan and
 * student, which is what the printed form does too: one row per child, not one per subject.
 */
export interface Adaptation {
  id: string
  planId: string
  studentId: string
  studentName: string | null
  /** "Discapacidad/Talento extraordinario/TDH/TEA y otros" — the second column of the form. */
  conditionType: string | null
  adaptedContents: string | null
  adaptedMethodology: string | null
  adaptedCriteria: string | null
  createdById: string | null
  updatedById: string | null
  createdAt: string
  updatedAt: string
}

export interface CreateAdaptationPayload {
  id_curriculum_plan: string
  id_student: string
  conditionType?: string
  adaptedContents?: string
  adaptedMethodology?: string
  adaptedCriteria?: string
}

/** Every field optional: an omitted column keeps the value the row already holds. */
export interface UpdateAdaptationPayload {
  conditionType?: string
  adaptedContents?: string
  adaptedMethodology?: string
  adaptedCriteria?: string
}
