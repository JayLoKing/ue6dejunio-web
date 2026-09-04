import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { StudentsTable } from "./StudentsTable"
import type { StudentRow } from "../types"

const row = (over: Partial<StudentRow> = {}): StudentRow => ({
  courseEnrollmentId: "ce-1",
  studentId: "st-1",
  rudeCode: "12345",
  identityCard: "9876543",
  fullName: "Ana Quispe",
  status: "Effective",
  ...over,
})

describe("StudentsTable", () => {
  // "Withdrawn" is what the column holds, not what a teacher reads.
  it("says the status in the language the roster is read in", () => {
    render(<StudentsTable data={[row({ status: "Withdrawn" })]} />)

    expect(screen.getByText("Dado de baja")).toBeInTheDocument()
    expect(screen.queryByText("Withdrawn")).not.toBeInTheDocument()
  })

  /**
   * The one row that raises a question is the one that can answer it. A student still on the roll
   * has no withdrawal to explain, so offering the button there would open an empty panel.
   */
  it("offers the reason only on a student who was withdrawn", () => {
    render(
      <StudentsTable
        data={[
          row({ courseEnrollmentId: "ce-1", status: "Effective" }),
          row({
            courseEnrollmentId: "ce-2",
            studentId: "st-2",
            fullName: "Luis Mamani",
            status: "Withdrawn",
          }),
        ]}
        onOpenWithdrawal={vi.fn()}
      />
    )

    expect(
      screen.getAllByRole("button", { name: /motivo de la baja/i })
    ).toHaveLength(1)
  })

  it("asks about the student behind the row, not their enrolment", async () => {
    const onOpenWithdrawal = vi.fn()
    render(
      <StudentsTable
        data={[row({ studentId: "st-7", status: "Withdrawn" })]}
        onOpenWithdrawal={onOpenWithdrawal}
      />
    )

    await userEvent.click(
      screen.getByRole("button", { name: /motivo de la baja/i })
    )

    expect(onOpenWithdrawal).toHaveBeenCalledWith("st-7")
  })

  /** The roster is the same table wherever it is shown; the reason is what a caller opts into. */
  it("offers nothing to open when nobody is listening", () => {
    render(<StudentsTable data={[row({ status: "Withdrawn" })]} />)

    expect(
      screen.queryByRole("button", { name: /motivo de la baja/i })
    ).not.toBeInTheDocument()
  })
})
