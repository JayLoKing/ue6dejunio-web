export type PdcStatus =
  | "Draft"
  | "Published"
  | "Under Review"
  | "With Observations"
  | "Approved"

export interface Pdc {
  id: string
  classGroupId: string
  subjectName: string
  teacherName: string
  createdById: string
  updatedById: string | null
  updatedByName: string | null
  trimester: number
  status: string
  reviewObservations: string | null
  title: string
  holisticObjective: string | null
  learningObjective: string | null
  contents: string | null
  practiceActivities: string | null
  theoryActivities: string | null
  valuationActivities: string | null
  productionActivities: string | null
  resources: string | null
  startDate: string | null
  endDate: string | null
  criteriaBeing: string | null
  criteriaKnowing: string | null
  criteriaDoing: string | null
  criteriaDeciding: string | null
  createdAt: string
  updatedAt: string
}

export interface PdcFormPayload {
  id_class_group: string
  trimester: number
  title: string
  holisticObjective?: string
  learningObjective?: string
  contents?: string
  practiceActivities?: string
  theoryActivities?: string
  valuationActivities?: string
  productionActivities?: string
  resources?: string
  startDate?: string
  endDate?: string
  criteriaBeing?: string
  criteriaKnowing?: string
  criteriaDoing?: string
  criteriaDeciding?: string
}

export const STATUS_BADGE: Record<string, string> = {
  Draft: "bg-muted text-muted-foreground",
  Published: "bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-500/30",
  "Under Review": "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30",
  "With Observations":
    "bg-destructive/15 text-destructive border border-destructive/30",
  Approved:
    "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30",
}
