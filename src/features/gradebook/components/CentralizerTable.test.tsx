import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

const useCentralizer = vi.hoisted(() => vi.fn())
vi.mock("../hooks/useGradebook", () => ({ useCentralizer }))
// The trimester picker reads the calendar from the API; this test is about the table.
vi.mock("@/components/shared/TrimesterSelect", () => ({
  TrimesterSelect: () => null,
}))

import { CentralizerTable } from "./CentralizerTable"
import type { StudentSummary } from "../types"

/**
 * The trimester sheet. For a technical teacher the API keeps only their subjects and nulls the
 * general average: it spans every subject. A "0.00" and a "Reprobado" built from that null would be
 * a claim about the student nobody made.
 */

const row = (over: Partial<StudentSummary> = {}): StudentSummary => ({
  courseEnrollmentId: "ce-1",
  studentId: "st-1",
  fullName: "Ana Aguilar",
  subjects: [
    {
      classGroupId: "cg-1",
      subjectName: "Computación",
      total: 78,
      graded: true,
    },
  ],
  trimester: 1,
  generalAverage: 78,
  ...over,
})

const page = (rows: StudentSummary[]) => ({
  data: { content: rows, page: 0, total: rows.length, totalPages: 1 },
  isLoading: false,
  isFetching: false,
})

describe("CentralizerTable", () => {
  it("shows the general average and situation of the whole course", () => {
    useCentralizer.mockReturnValue(page([row()]))

    render(<CentralizerTable courseId="c-1" />)

    expect(screen.getByText("PROM.")).toBeInTheDocument()
    expect(screen.getByText("Situación")).toBeInTheDocument()
    expect(screen.getByText(/aprobados/)).toBeInTheDocument()
  })

  it("drops the average, the situation and the counters for one subject's sheet", () => {
    useCentralizer.mockReturnValue(page([row({ generalAverage: null })]))

    render(<CentralizerTable courseId="c-1" subjectOnly />)

    expect(screen.getByText("78.0")).toBeInTheDocument()
    expect(screen.queryByText("PROM.")).not.toBeInTheDocument()
    expect(screen.queryByText("Situación")).not.toBeInTheDocument()
    expect(screen.queryByText("0.00")).not.toBeInTheDocument()
    expect(screen.queryByText(/reprobados/)).not.toBeInTheDocument()
  })
})
