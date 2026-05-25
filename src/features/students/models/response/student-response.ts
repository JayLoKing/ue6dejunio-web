import type { Gender } from "../../types"

export interface EnrollmentRef {
  enrollmentId: string
  classGroupId: string
  subjectId: string
  subjectName: string
}

export interface StudentResponse {
  id: string
  rudeCode: string
  identityCard: string
  names: string
  lastNames: string
  birthDate: string
  gender: Gender
  status: string
  statusReason: string | null
  createdAt: string
  enrollments: EnrollmentRef[]
}
