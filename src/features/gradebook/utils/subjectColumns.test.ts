import { describe, expect, it } from "vitest"

import { subjectColumnsOf } from "./subjectColumns"
import type { StudentSubjectTotal, StudentSummary } from "../types"

const subject = (
  classGroupId: string,
  subjectName: string
): StudentSubjectTotal => ({
  classGroupId,
  subjectName,
  total: 70,
  graded: true,
})

const student = (
  courseEnrollmentId: string,
  subjects: StudentSubjectTotal[]
): StudentSummary => ({
  courseEnrollmentId,
  studentId: `st-${courseEnrollmentId}`,
  fullName: `Estudiante ${courseEnrollmentId}`,
  trimester: 1,
  subjects,
  generalAverage: 70,
})

const LANGUAGE = subject("cg-1", "Comunicación y Lenguajes")
const MATHS = subject("cg-2", "Matemática")
const MUSIC = subject("cg-3", "Educación Musical")

describe("subjectColumnsOf", () => {
  it("keeps the order the course's subjects arrive in", () => {
    const columns = subjectColumnsOf([
      student("e-1", [LANGUAGE, MATHS, MUSIC]),
      student("e-2", [LANGUAGE, MATHS, MUSIC]),
    ])

    expect(columns.map((c) => c.classGroupId)).toEqual(["cg-1", "cg-2", "cg-3"])
  })

  // The bug this exists for: the columns used to be read off the first row alone, so a student
  // missing a subject took that subject's column away from every classmate on the page.
  it("keeps a column the first student of the page does not have", () => {
    const columns = subjectColumnsOf([
      student("e-1", [LANGUAGE, MATHS]),
      student("e-2", [LANGUAGE, MATHS, MUSIC]),
    ])

    expect(columns.map((c) => c.classGroupId)).toEqual(["cg-1", "cg-2", "cg-3"])
  })

  // The fullest row is what the header is built from, so a subject missing from a shorter row lands
  // in its own place rather than appended after the ones that follow it.
  it("places a missing subject where the course puts it, not at the end", () => {
    const columns = subjectColumnsOf([
      student("e-1", [LANGUAGE, MUSIC]),
      student("e-2", [LANGUAGE, MATHS, MUSIC]),
    ])

    expect(columns.map((c) => c.classGroupId)).toEqual(["cg-1", "cg-2", "cg-3"])
  })

  it("names each column once however many students hold it", () => {
    const columns = subjectColumnsOf([
      student("e-1", [LANGUAGE, MATHS]),
      student("e-2", [LANGUAGE, MATHS]),
      student("e-3", [LANGUAGE, MATHS]),
    ])

    expect(columns).toHaveLength(2)
  })

  // A subject nobody on the page holds is not a column: the header would head an empty strip.
  it("has no columns when the page has no students", () => {
    expect(subjectColumnsOf([])).toEqual([])
  })

  it("has no columns when nobody was graded in anything yet", () => {
    expect(subjectColumnsOf([student("e-1", [])])).toEqual([])
  })
})
