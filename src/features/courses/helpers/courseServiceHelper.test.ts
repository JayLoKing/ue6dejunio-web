import { beforeEach, describe, expect, it, vi } from "vitest"

const put = vi.hoisted(() => vi.fn())

vi.mock("@/lib/axios", () => ({ httpClient: { put } }))

import CourseServiceHelper from "./courseServiceHelper"

beforeEach(() => {
  vi.clearAllMocks()
  put.mockResolvedValue({ data: {} })
})

describe("CourseServiceHelper.reassignSubjectTeacherAsync", () => {
  it("PUTs the new teacher to the class group's teacher endpoint", async () => {
    await new CourseServiceHelper().reassignSubjectTeacherAsync(
      "course-1",
      "cg-1",
      "teacher-9"
    ).call

    expect(put).toHaveBeenCalledWith(
      "/courses/course-1/class-groups/cg-1/teacher",
      { teacherId: "teacher-9" },
      expect.anything()
    )
  })
})
