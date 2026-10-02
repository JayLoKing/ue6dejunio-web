import type { AcademicYearItem } from "@/features/catalog/types"

/** POST /academic-years: the year, and whether this call opened it or it was already there. */
export interface CreatedAcademicYear {
  year: AcademicYearItem
  created: boolean
}

/** POST /academic-years/{id}/duplicate-structure. */
export interface DuplicateStructureSummary {
  coursesCreated: number
  coursesSkipped: number
  classGroupsCreated: number
  /** "Grade Parallel" of each course the target already had. */
  skippedCourses: string[]
}
