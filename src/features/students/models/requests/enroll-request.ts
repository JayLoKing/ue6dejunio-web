import type { StudentPayload } from "../../types"

export interface EnrollSingleRequest {
  id_grade: number
  id_parallel: number
  student: StudentPayload
}

export interface EnrollBatchRequest {
  id_grade: number
  id_parallel: number
  students: StudentPayload[]
}
