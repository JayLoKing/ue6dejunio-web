export type Gender = "M" | "F"

export interface StudentPayload {
  rudeCode: string
  identityCard: string
  names: string
  lastNames: string
  birthDate: string
  gender: Gender
}

export interface ParsedStudentRow extends StudentPayload {
  rowIndex: number
  rawFullName: string
  fullName: string
}
