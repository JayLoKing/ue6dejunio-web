import { render, screen, within } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { EnrollResultSummary } from "./EnrollResultSummary"
import type { EnrollResponse } from "../models/response/enroll-response"

const result = (over: Partial<EnrollResponse> = {}): EnrollResponse => ({
  studentsTotal: 10,
  studentsCreated: 4,
  studentsExisting: 6,
  studentsFromPreviousYear: 3,
  studentsReentering: 2,
  enrollmentsCreated: 9,
  enrollmentsSkipped: 0,
  skippedWithdrawn: [],
  ...over,
})

describe("EnrollResultSummary", () => {
  /** The three groups a roster load tells apart: new, came from last year, coming back. */
  it("reports new students, previous-year students and re-entries separately", () => {
    render(<EnrollResultSummary result={result()} />)

    expect(screen.getByText("Nuevos").nextSibling).toHaveTextContent("4")
    expect(
      screen.getByText("De la gestión anterior").nextSibling
    ).toHaveTextContent("3")
    expect(screen.getByText("Reingresos").nextSibling).toHaveTextContent("2")
  })

  it("does not mention withdrawn students when none were skipped", () => {
    render(<EnrollResultSummary result={result()} />)

    expect(screen.queryByText(/Retirados omitidos/)).not.toBeInTheDocument()
  })

  /** A withdrawn student is skipped for every caller; only the Director reinstates. */
  it("lists the skipped withdrawn students by name and says who can bring them back", () => {
    render(
      <EnrollResultSummary
        result={result({
          skippedWithdrawn: [
            { studentId: "s-1", fullName: "Ana Quispe" },
            { studentId: "s-2", fullName: "Luis Mamani" },
          ],
        })}
      />
    )

    expect(
      screen.getByText(
        /Retirados omitidos — solo el Director puede reincorporarlos/
      )
    ).toBeInTheDocument()
    const list = screen.getByRole("list")
    expect(within(list).getByText("Ana Quispe")).toBeInTheDocument()
    expect(within(list).getByText("Luis Mamani")).toBeInTheDocument()
  })
})
