import type { SubjectAssignment } from "../../types"

export interface CreateClassGroupRequest {
  id_grade: number
  id_parallel: number
  assignments: SubjectAssignment[]
}
