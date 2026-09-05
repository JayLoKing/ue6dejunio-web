import { describe, expect, it } from "vitest"

import {
  ASSIGNABLE_ROLES,
  ROLES,
  roleOptionsFor,
  teachesSubjects,
} from "./index"

describe("assignable roles", () => {
  /**
   * The Director account is created by the system at start-up from the environment, and there is
   * one. Offering the role here would invite a second one from a screen that knows nothing about
   * that decision.
   */
  it("does not offer the Director role", () => {
    expect(ASSIGNABLE_ROLES.map((r) => r.name)).not.toContain("DIRECTOR")
    expect(ASSIGNABLE_ROLES.map((r) => r.name)).toEqual([
      "SECRETARY",
      "TEACHER",
    ])
  })

  it("still knows every role exists, for reading one back", () => {
    expect(ROLES.map((r) => r.name)).toContain("DIRECTOR")
  })
})

describe("teachesSubjects", () => {
  it("recognises the teaching role", () => {
    expect(teachesSubjects(3)).toBe(true)
  })

  it("says no for every other role", () => {
    expect(teachesSubjects(1)).toBe(false)
    expect(teachesSubjects(2)).toBe(false)
  })

  /** No role chosen is not a teaching role, and must not read as one. */
  it("says no when nothing has been chosen", () => {
    expect(teachesSubjects(undefined)).toBe(false)
  })
})

describe("roleOptionsFor", () => {
  it("offers only the assignable roles to an ordinary user", () => {
    expect(roleOptionsFor("TEACHER").map((r) => r.name)).toEqual([
      "SECRETARY",
      "TEACHER",
    ])
  })

  /**
   * A select that cannot find its own value renders blank, and a form showing an empty role reads
   * as saying the person has none.
   */
  it("keeps the Director's own role visible when editing them", () => {
    expect(roleOptionsFor("DIRECTOR").map((r) => r.name)).toEqual([
      "DIRECTOR",
      "SECRETARY",
      "TEACHER",
    ])
  })

  it("reads the role however the server spells it", () => {
    expect(roleOptionsFor("director")[0].name).toBe("DIRECTOR")
  })

  it("falls back to the assignable ones for a role it does not know", () => {
    expect(roleOptionsFor("").map((r) => r.name)).toEqual([
      "SECRETARY",
      "TEACHER",
    ])
  })
})
