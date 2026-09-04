import { describe, expect, it } from "vitest"

import { EMPTY_DIRECTORY_FILTERS } from "../types"
import { toDirectoryParams } from "./directoryParams"

describe("toDirectoryParams", () => {
  it("sends nothing but the scope when nothing was picked", () => {
    expect(toDirectoryParams(EMPTY_DIRECTORY_FILTERS)).toEqual({
      scope: "ACTIVE",
    })
  })

  /**
   * The backend answers about the current gestión precisely when the parameter is absent. Sending
   * it empty would be a different question, not "no filter".
   */
  it("leaves the gestión out rather than sending it empty", () => {
    expect(toDirectoryParams(EMPTY_DIRECTORY_FILTERS)).not.toHaveProperty(
      "academicYearId"
    )
  })

  it("sends the gestión that was picked", () => {
    const params = toDirectoryParams({
      ...EMPTY_DIRECTORY_FILTERS,
      academicYearId: 3,
    })

    expect(params.academicYearId).toBe(3)
  })

  it("trims what was typed and drops a blank search", () => {
    expect(
      toDirectoryParams({ ...EMPTY_DIRECTORY_FILTERS, q: "  Lopez  " }).q
    ).toBe("Lopez")
    expect(
      toDirectoryParams({ ...EMPTY_DIRECTORY_FILTERS, q: "   " })
    ).not.toHaveProperty("q")
  })

  it("carries grade and parallel once they are chosen", () => {
    const params = toDirectoryParams({
      ...EMPTY_DIRECTORY_FILTERS,
      gradeId: 1,
      parallelId: 2,
      scope: "ALL",
    })

    expect(params).toEqual({ scope: "ALL", gradeId: 1, parallelId: 2 })
  })

  /**
   * A course belongs to one gestión already, so a listing scoped to one asks for no year: the
   * backend leaves the current-gestión default alone when a course was named.
   */
  it("carries the course without asking for a gestión alongside it", () => {
    const params = toDirectoryParams({
      ...EMPTY_DIRECTORY_FILTERS,
      courseId: "c-1",
      scope: "ALL",
    })

    expect(params).toEqual({ scope: "ALL", courseId: "c-1" })
  })

  /** An id of zero is an id, not an unset filter. The guard is against null, not against falsy. */
  it("does not mistake a zero id for an unset filter", () => {
    const params = toDirectoryParams({
      ...EMPTY_DIRECTORY_FILTERS,
      gradeId: 0,
    })

    expect(params.gradeId).toBe(0)
  })
})
