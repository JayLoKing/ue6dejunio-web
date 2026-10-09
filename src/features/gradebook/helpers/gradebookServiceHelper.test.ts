import { beforeEach, describe, expect, it, vi } from "vitest"

const get = vi.hoisted(() => vi.fn())

vi.mock("@/lib/axios", () => ({ httpClient: { get } }))

import GradebookServiceHelper from "./gradebookServiceHelper"

const WHOLE = { offset: 1, limit: 200, sort: "asc" as const }

beforeEach(() => {
  vi.clearAllMocks()
  get.mockResolvedValue({ data: {} })
})

describe("GradebookServiceHelper.classGroupAttendanceByStudentAsync", () => {
  it("asks for one class group's session attendance in a trimester", async () => {
    await new GradebookServiceHelper().classGroupAttendanceByStudentAsync(
      "cg-1",
      2,
      WHOLE
    ).call

    expect(get).toHaveBeenCalledWith(
      "/gradebook/attendance/session/by-student",
      expect.objectContaining({
        params: {
          offset: 1,
          limit: 200,
          sort: "asc",
          id_class_group: "cg-1",
          trimester: 2,
        },
      })
    )
  })

  /** The annual scope is the absent trimester, never an empty one. */
  it("sends no trimester at all for the annual scope", async () => {
    await new GradebookServiceHelper().classGroupAttendanceByStudentAsync(
      "cg-1",
      null,
      WHOLE
    ).call

    const params = get.mock.calls[0][1].params as Record<string, unknown>
    expect(params.id_class_group).toBe("cg-1")
    expect(params).not.toHaveProperty("trimester")
  })
})
