import { describe, expect, it } from "vitest"

import { CELL_TO_API, cellFromApi, nextStatus } from "./attendanceStatus"

describe("nextStatus", () => {
  it("cycles through every status and back", () => {
    expect(nextStatus(null)).toBe("P")
    expect(nextStatus("P")).toBe("A")
    expect(nextStatus("A")).toBe("R")
    expect(nextStatus("R")).toBe("L")
    expect(nextStatus("L")).toBe("P")
  })
})

describe("CELL_TO_API", () => {
  it("sends a late arrival as Late, not as an absence", () => {
    expect(CELL_TO_API.R).toBe("Late")
  })
})

describe("cellFromApi", () => {
  it("maps every status the API is known to send", () => {
    expect(cellFromApi("Present")).toBe("P")
    expect(cellFromApi("Absent")).toBe("A")
    expect(cellFromApi("Excused")).toBe("L")
  })

  // It used to read as absent, so re-saving the day silently turned every late into an absence.
  it("reads a late arrival as late", () => {
    expect(cellFromApi("Late")).toBe("R")
  })

  // The wire type is a plain string, so a status added on the server before the front end knows
  // about it must not leak undefined into a record that promises AttendanceCellStatus.
  it("reads an unknown status as no mark", () => {
    expect(cellFromApi("Sabbatical")).toBeNull()
    expect(cellFromApi("")).toBeNull()
  })

  it("does not answer for inherited object keys", () => {
    expect(cellFromApi("toString")).toBeNull()
    expect(cellFromApi("constructor")).toBeNull()
  })
})
