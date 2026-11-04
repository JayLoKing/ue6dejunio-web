import { describe, expect, it } from "vitest"

import { canEditStudent } from "./studentEditPermission"

const homeroom = { role: "TEACHER", courseId: "c-1", isTechnical: false }

describe("canEditStudent", () => {
  it("lets the Director edit anyone, withdrawn included", () => {
    const who = { role: "DIRECTOR", courseId: null, isTechnical: null }

    expect(canEditStudent(who, "c-9", "Effective")).toBe(true)
    expect(canEditStudent(who, null, "Withdrawn")).toBe(true)
  })

  it("lets a homeroom teacher edit a student still in their course", () => {
    expect(canEditStudent(homeroom, "c-1", "Effective")).toBe(true)
  })

  // The API checks an effective seat in the teacher's course: anything else is a 403.
  it("refuses the homeroom teacher another course or a withdrawn student", () => {
    expect(canEditStudent(homeroom, "c-2", "Effective")).toBe(false)
    expect(canEditStudent(homeroom, "c-1", "Withdrawn")).toBe(false)
  })

  it("refuses the Secretary and the technical teacher", () => {
    expect(
      canEditStudent(
        { role: "SECRETARY", courseId: null, isTechnical: null },
        "c-1",
        "Effective"
      )
    ).toBe(false)
    expect(
      canEditStudent({ ...homeroom, isTechnical: true }, "c-1", "Effective")
    ).toBe(false)
  })
})
