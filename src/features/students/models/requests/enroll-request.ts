import type { StudentPayload } from "../../types"

export interface EnrollSingleRequest {
  id_course: string
  student: StudentPayload
}

export interface EnrollBatchRequest {
  id_course: string
  students: StudentPayload[]
}
