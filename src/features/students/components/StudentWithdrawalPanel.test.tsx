import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { StudentWithdrawalPanel } from "./StudentWithdrawalPanel"
import type { StudentDetail } from "../types"

const withdrawn = (over: Partial<StudentDetail> = {}): StudentDetail => ({
  id: "st-1",
  rudeCode: "12345",
  identityCard: "9876543",
  names: "Ana",
  lastNames: "Quispe",
  status: "Withdrawn",
  statusReason: "Transferencia",
  statusNote: null,
  statusChangedAt: "2026-09-03T10:30:00",
  statusChangedById: "u-1",
  statusChangedByName: "Marcial Pérez",
  ...over,
})

describe("StudentWithdrawalPanel", () => {
  it("says who left, under which category, and who decided", () => {
    render(<StudentWithdrawalPanel student={withdrawn()} />)

    expect(screen.getByText(/Ana Quispe/)).toBeInTheDocument()
    expect(screen.getByText("Transferencia")).toBeInTheDocument()
    expect(screen.getByText("Marcial Pérez")).toBeInTheDocument()
  })

  // "Otro" is the category that says nothing on its own; the note is the reason it exists.
  it("shows the words behind the open category", () => {
    render(
      <StudentWithdrawalPanel
        student={withdrawn({
          statusReason: "Otro",
          statusNote: "Se mudó a Santa Cruz con su familia.",
        })}
      />
    )

    expect(
      screen.getByText("Se mudó a Santa Cruz con su familia.")
    ).toBeInTheDocument()
  })

  /**
   * Read-only, and it has to look it. This panel informs a teacher about a decision the Director
   * already made; an action here would promise something the API refuses them.
   */
  it("offers nothing to press", () => {
    render(<StudentWithdrawalPanel student={withdrawn()} />)

    expect(screen.queryAllByRole("button")).toHaveLength(0)
    expect(screen.queryAllByRole("textbox")).toHaveLength(0)
  })

  // A change recorded before there was an author column, or by an account since removed.
  it("does not invent an author it was not given", () => {
    render(
      <StudentWithdrawalPanel
        student={withdrawn({
          statusChangedByName: null,
          statusChangedById: null,
        })}
      />
    )

    expect(screen.queryByText("Marcial Pérez")).not.toBeInTheDocument()
    expect(screen.getByText(/Sin registro/)).toBeInTheDocument()
  })

  /** A student still on the roll has no withdrawal to explain. */
  it("says so when the student was never withdrawn", () => {
    render(
      <StudentWithdrawalPanel
        student={withdrawn({
          status: "Effective",
          statusReason: null,
          statusChangedAt: null,
          statusChangedByName: null,
        })}
      />
    )

    expect(screen.getByText(/no fue dado de baja/i)).toBeInTheDocument()
  })
})
