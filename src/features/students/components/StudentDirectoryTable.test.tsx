import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { StudentDirectoryTable } from "./StudentDirectoryTable"
import type { StudentDirectoryResponse } from "../models/response/student-directory-response"

const row = (
  over: Partial<StudentDirectoryResponse> = {}
): StudentDirectoryResponse => ({
  id: "st-1",
  rudeCode: "12345",
  identityCard: "9876543",
  fullName: "Ana Quispe",
  grade: "Primero",
  parallel: "A",
  level: "Primaria Comunitaria Vocacional",
  status: "Effective",
  academicYear: 2026,
  ...over,
})

const props = {
  page: 1,
  pageSize: 10,
  total: 1,
  totalPages: 1,
  onPageChange: vi.fn(),
  onPageSizeChange: vi.fn(),
  onOpenWithdrawal: vi.fn(),
}

describe("StudentDirectoryTable", () => {
  /** A grade is only true of one year, so the row has to name the year it is talking about. */
  it("shows the gestión the grade belongs to", () => {
    render(<StudentDirectoryTable {...props} rows={[row()]} />)

    expect(screen.getByText("2026")).toBeInTheDocument()
    expect(screen.getByText("Primero")).toBeInTheDocument()
  })

  /**
   * A student registered but not yet enrolled has no course, and appears anyway. Blank cells would
   * read as missing data; a dash says there is nothing there yet.
   */
  it("marks the student who has no course yet instead of leaving gaps", () => {
    render(
      <StudentDirectoryTable
        {...props}
        rows={[row({ grade: null, parallel: null, academicYear: null })]}
      />
    )

    expect(screen.getByText("Ana Quispe")).toBeInTheDocument()
    expect(screen.getAllByText("—")).toHaveLength(3)
  })

  /** Taking a student off the roll is the Director's. The secretariat reads this same listing. */
  it("offers no withdrawal when the caller cannot decide one", () => {
    render(<StudentDirectoryTable {...props} rows={[row()]} />)

    expect(
      screen.queryByRole("button", { name: /Dar de baja a/ })
    ).not.toBeInTheDocument()
  })

  it("offers the withdrawal on a student still on the roll", async () => {
    const onWithdraw = vi.fn()
    render(
      <StudentDirectoryTable
        {...props}
        rows={[row()]}
        onWithdraw={onWithdraw}
      />
    )

    await userEvent.click(
      screen.getByRole("button", { name: /Dar de baja a Ana Quispe/ })
    )

    expect(onWithdraw).toHaveBeenCalledWith(
      expect.objectContaining({ id: "st-1" })
    )
  })

  /**
   * Someone already withdrawn cannot be withdrawn again — the API answers 409. The row offers the
   * reason instead, which is the question that student actually raises.
   */
  it("offers the reason, not another withdrawal, on someone who already left", () => {
    render(
      <StudentDirectoryTable
        {...props}
        rows={[row({ status: "Withdrawn" })]}
        onWithdraw={vi.fn()}
      />
    )

    expect(
      screen.getByRole("button", { name: /Ver el motivo de la baja/ })
    ).toBeInTheDocument()
    expect(
      screen.queryByRole("button", { name: /Dar de baja a/ })
    ).not.toBeInTheDocument()
    expect(screen.getByText("Dado de baja")).toBeInTheDocument()
  })
})
