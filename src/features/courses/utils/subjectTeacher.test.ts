import { describe, expect, it } from "vitest"

import { resolveSubjectTeacher } from "./subjectTeacher"

const HOMEROOM = "aula-1"
const TECHNICAL = "tecnico-1"

describe("resolveSubjectTeacher", () => {
  describe("an ordinary subject", () => {
    it("falls to the teacher who runs the course when nobody was picked", () => {
      expect(
        resolveSubjectTeacher(
          false,
          { teacherId: null, byHomeroom: false },
          HOMEROOM
        )
      ).toBe(HOMEROOM)
    })

    it("keeps whoever was picked by hand", () => {
      expect(
        resolveSubjectTeacher(
          false,
          { teacherId: "otro", byHomeroom: false },
          HOMEROOM
        )
      ).toBe("otro")
    })
  })

  describe("a technical subject", () => {
    /**
     * No default here. When a technical teacher is free the subject is theirs, and falling to the
     * homeroom teacher by omission would hand it to somebody nobody chose.
     */
    it("has nobody until somebody is chosen", () => {
      expect(
        resolveSubjectTeacher(
          true,
          { teacherId: null, byHomeroom: false },
          HOMEROOM
        )
      ).toBeUndefined()
    })

    it("takes the technical teacher that was chosen", () => {
      expect(
        resolveSubjectTeacher(
          true,
          { teacherId: TECHNICAL, byHomeroom: false },
          HOMEROOM
        )
      ).toBe(TECHNICAL)
    })

    /** There are not enough technical teachers for every course, so the one in charge teaches it. */
    it("goes to the homeroom teacher once the box is ticked", () => {
      expect(
        resolveSubjectTeacher(
          true,
          { teacherId: null, byHomeroom: true },
          HOMEROOM
        )
      ).toBe(HOMEROOM)
    })

    /** The box is the later answer, so it wins over one left selected before it was ticked. */
    it("lets the box override a technical teacher still selected underneath", () => {
      expect(
        resolveSubjectTeacher(
          true,
          { teacherId: TECHNICAL, byHomeroom: true },
          HOMEROOM
        )
      ).toBe(HOMEROOM)
    })

    /** Ticking it before the course has a homeroom teacher does not invent one. */
    it("resolves to nobody while the course has no homeroom teacher", () => {
      expect(
        resolveSubjectTeacher(
          true,
          { teacherId: null, byHomeroom: true },
          undefined
        )
      ).toBeUndefined()
    })
  })

  it("treats a subject nobody touched as having made no choice", () => {
    expect(resolveSubjectTeacher(false, undefined, HOMEROOM)).toBe(HOMEROOM)
    expect(resolveSubjectTeacher(true, undefined, HOMEROOM)).toBeUndefined()
  })
})
