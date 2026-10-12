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
  reinstated: [],
  skippedWithdrawn: [],
  skippedOtherCourse: [],
  conflicts: [],
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

  it("does not mention the new groups when the load had none of them", () => {
    render(<EnrollResultSummary result={result()} />)

    expect(screen.queryByText(/otro curso/)).not.toBeInTheDocument()
    expect(screen.queryByText(/Reincorporados/)).not.toBeInTheDocument()
    expect(screen.queryByText(/Datos en conflicto/)).not.toBeInTheDocument()
  })

  /** Quien cargó la nómina tiene que saber en qué curso está cada uno para aclararlo. */
  it("lists the students already enrolled in another course with that course", () => {
    render(
      <EnrollResultSummary
        result={result({
          skippedOtherCourse: [
            {
              studentId: "s-1",
              rudeCode: "R-1",
              fullName: "Ana Quispe",
              courseLabel: "Segundo B",
            },
          ],
        })}
      />
    )

    const group = screen.getByRole("region", {
      name: "Ya inscritos en otro curso de esta gestión",
    })
    expect(within(group).getByText(/Ana Quispe/)).toHaveTextContent(
      "Ana Quispe — Segundo B"
    )
  })

  it("lists the students reinstated from an earlier gestión", () => {
    render(
      <EnrollResultSummary
        result={result({
          reinstated: [{ studentId: "s-1", fullName: "Ana Quispe" }],
        })}
      />
    )

    const group = screen.getByRole("region", {
      name: "Reincorporados de una gestión anterior",
    })
    expect(within(group).getByText("Ana Quispe")).toBeInTheDocument()
  })

  it("lists the conflicting rows with their RUDE, CI and the reason", () => {
    render(
      <EnrollResultSummary
        result={result({
          conflicts: [
            {
              rudeCode: "R-1",
              identityCard: "CI-2",
              fullName: "Ana Quispe",
              reason: "El RUDE corresponde a Ana Quispe y el CI a Luis Mamani.",
            },
          ],
        })}
      />
    )

    const group = screen.getByRole("region", {
      name: "Datos en conflicto (RUDE y CI de estudiantes distintos)",
    })
    const item = within(group).getByRole("listitem")
    expect(item).toHaveTextContent("Ana Quispe")
    expect(item).toHaveTextContent("RUDE R-1")
    expect(item).toHaveTextContent("CI CI-2")
    expect(item).toHaveTextContent(
      "El RUDE corresponde a Ana Quispe y el CI a Luis Mamani."
    )
  })
})
