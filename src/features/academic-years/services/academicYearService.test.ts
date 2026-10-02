import { beforeEach, describe, expect, it, vi } from "vitest"

const put = vi.hoisted(() => vi.fn())

vi.mock("@/lib/axios", () => ({ httpClient: { put } }))

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
})
