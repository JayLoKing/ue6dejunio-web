import { describe, expect, it } from "vitest"

import { coursePermissions } from "./coursePermissions"

describe("coursePermissions", () => {
  it("gives the Director every course action", () => {
    expect(coursePermissions("DIRECTOR")).toEqual({
      canCreateCourse: true,
      canSetHomeroom: true,
      canDuplicateStructure: true,
      canSwapHomeroom: true,
      canReassignSubjectTeacher: true,
      canOpenNotebook: true,
      canManageYears: true,
      canCreateYear: true,
      canDeactivateCourse: true,
    })
  })

  // The secretariat runs the course lifecycle; the API keeps the rest behind the Director.
  it("gives the Secretary the lifecycle and a read-only look at the notebook", () => {
    expect(coursePermissions("SECRETARY")).toEqual({
      canCreateCourse: true,
      canSetHomeroom: true,
      canDuplicateStructure: true,
      canSwapHomeroom: false,
      canReassignSubjectTeacher: false,
      canOpenNotebook: true,
      canManageYears: false,
      canCreateYear: true,
      canDeactivateCourse: true,
    })
  })

  it("gives the Teacher nothing", () => {
    expect(Object.values(coursePermissions("TEACHER")).some(Boolean)).toBe(
      false
    )
  })

  it("grants nothing without a role", () => {
    expect(Object.values(coursePermissions(null)).some(Boolean)).toBe(false)
  })

  it("ignores how the role is spelled", () => {
    expect(coursePermissions("secretary").canCreateCourse).toBe(true)
  })
})
