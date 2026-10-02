import { beforeEach, describe, expect, it, vi } from "vitest"

const put = vi.hoisted(() => vi.fn())
const post = vi.hoisted(() => vi.fn())

vi.mock("@/lib/axios", () => ({ httpClient: { put, post } }))

import { AcademicYearService } from "./academicYearService"

const item = { id: 7, year: 2026, active: false, closed: true }

beforeEach(() => {
  vi.clearAllMocks()
  put.mockResolvedValue({ data: item })
})

describe("AcademicYearService", () => {
  it("activates a year with PUT /academic-years/{id}/activate", async () => {
    await expect(AcademicYearService.activate(7)).resolves.toEqual(item)
    expect(put.mock.calls[0][0]).toBe("/academic-years/7/activate")
  })

  it("closes a year with PUT /academic-years/{id}/close", async () => {
    await expect(AcademicYearService.close(7)).resolves.toEqual(item)
    expect(put.mock.calls[0][0]).toBe("/academic-years/7/close")
  })

  it("reopens a year with PUT /academic-years/{id}/reopen", async () => {
    await expect(AcademicYearService.reopen(7)).resolves.toEqual(item)
    expect(put.mock.calls[0][0]).toBe("/academic-years/7/reopen")
  })

  describe("create", () => {
    const fresh = { id: 9, year: 2027, active: false, closed: false }

    it("posts the calendar year to /academic-years", async () => {
      post.mockResolvedValue({ status: 201, data: fresh })

      await AcademicYearService.create(2027)

      expect(post.mock.calls[0][0]).toBe("/academic-years")
      expect(post.mock.calls[0][1]).toEqual({ year: 2027 })
    })

    it("reports a 201 as created", async () => {
      post.mockResolvedValue({ status: 201, data: fresh })

      await expect(AcademicYearService.create(2027)).resolves.toEqual({
        year: fresh,
        created: true,
      })
    })

    it("reports a 200 as a year that already existed", async () => {
      post.mockResolvedValue({ status: 200, data: fresh })

      await expect(AcademicYearService.create(2027)).resolves.toEqual({
        year: fresh,
        created: false,
      })
    })
  })

  describe("duplicateStructure", () => {
    const summary = {
      coursesCreated: 2,
      coursesSkipped: 1,
      classGroupsCreated: 14,
      skippedCourses: ["Primero A"],
    }

    it("posts the source year to the target's duplicate-structure path", async () => {
      post.mockResolvedValue({ status: 200, data: summary })

      await expect(
        AcademicYearService.duplicateStructure(9, 7)
      ).resolves.toEqual(summary)

      expect(post.mock.calls[0][0]).toBe(
        "/academic-years/9/duplicate-structure"
      )
      expect(post.mock.calls[0][1]).toEqual({ source_academic_year_id: 7 })
    })
  })
})
