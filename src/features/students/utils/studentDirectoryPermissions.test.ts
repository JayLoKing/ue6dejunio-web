import { describe, expect, it } from "vitest"

import { directoryPermissions } from "./studentDirectoryPermissions"

describe("directoryPermissions", () => {
  it("lets the Director withdraw and reinstate", () => {
    expect(directoryPermissions("DIRECTOR")).toEqual({
      canWithdraw: true,
      canReinstate: true,
      canOpenCourse: true,
    })
  })

  // The route is shared with the secretary, who reads the directory but does not move students.
  it("does not let the Secretary reinstate or withdraw", () => {
    expect(directoryPermissions("SECRETARY")).toEqual({
      canWithdraw: false,
      canReinstate: false,
      canOpenCourse: true,
    })
  })

  it("grants nothing without a role", () => {
    expect(directoryPermissions(null).canReinstate).toBe(false)
    expect(directoryPermissions(null).canOpenCourse).toBe(false)
  })
})
