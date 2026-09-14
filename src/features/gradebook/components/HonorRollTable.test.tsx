import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { HonorRollTable } from "./HonorRollTable"
import type { HonorRollEntry } from "../types"

const entry = (over: Partial<HonorRollEntry> = {}): HonorRollEntry => ({
  position: 1,
  courseEnrollmentId: "ce-1",
  studentId: "st-1",
  fullName: "Quispe Ana",
  courseId: "c-1",
  gradeName: "Quinto",
  parallelName: "B",
  finalAverage: 95.5,
  ...over,
})

describe("HonorRollTable", () => {
  it("names the student and the average that earned the place", () => {
    render(<HonorRollTable rows={[entry()]} />)

    expect(screen.getByText("Quispe Ana")).toBeInTheDocument()
    expect(screen.getByText("95.50")).toBeInTheDocument()
    expect(screen.getByText("1")).toBeInTheDocument()
  })

  /**
   * Two decimals, like every other sheet. Rounding to an integer would show 50.60 as 51 — which is
   * exactly the pass mark — and the podium would disagree with the libreta beside it.
   */
  it("prints the average with the two decimals the sheets use", () => {
    render(<HonorRollTable rows={[entry({ finalAverage: 88.4 })]} />)

    expect(screen.getByText("88.40")).toBeInTheDocument()
  })

  /**
   * The classroom only earns a column where the listing spans more than one. A teacher reading
   * their own course does not need it repeated down three rows.
   */
  it("drops the classroom column on a single course's podium", () => {
    render(<HonorRollTable rows={[entry()]} />)

    expect(
      screen.queryByRole("columnheader", { name: "Curso" })
    ).not.toBeInTheDocument()
  })

  it("names the classroom on the school-wide podium, where two students can share a name", () => {
    render(<HonorRollTable rows={[entry()]} showCourse />)

    expect(
      screen.getByRole("columnheader", { name: "Curso" })
    ).toBeInTheDocument()
    expect(screen.getByText("Quinto B")).toBeInTheDocument()
  })

  /**
   * A course where nobody has marks yet and a podium that failed to load look the same without
   * this. The API leaves out the student with nothing graded on purpose — they were not judged.
   */
  it("says the podium is empty rather than drawing an empty table", () => {
    render(<HonorRollTable rows={[]} />)

    expect(screen.getByText(/Sin estudiantes/)).toBeInTheDocument()
  })

  /** The order came numbered from the API; re-sorting could put a row numbered 2 above one numbered 1. */
  it("keeps the order the podium arrived in", () => {
    render(
      <HonorRollTable
        rows={[
          entry({ position: 1, fullName: "Quispe Ana", finalAverage: 91 }),
          entry({
            position: 2,
            courseEnrollmentId: "ce-2",
            studentId: "st-2",
            fullName: "Rojas Beto",
            finalAverage: 99,
          }),
        ]}
      />
    )

    const names = screen
      .getAllByRole("row")
      .slice(1)
      .map((row) => row.querySelectorAll("td")[1]?.textContent)

    expect(names).toEqual(["Quispe Ana", "Rojas Beto"])
  })
})
