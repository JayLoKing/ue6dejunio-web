import { render, screen, within } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { AnnualCentralizerTable } from "./AnnualCentralizerTable"
import { AnnualRanking } from "./AnnualRanking"
import { TrimesterAveragesTable } from "./TrimesterAveragesTable"
import type { StudentAnnualSummary } from "../types"

/**
 * The three year-end sheets, presentational: they are handed rows and render them. The arithmetic
 * is the API's — what these tests pin is that a number the school reads off paper is the number
 * that shows up, and that "not graded" never renders as a zero.
 */

const nelsy: StudentAnnualSummary = {
  courseEnrollmentId: "enr-1",
  studentId: "stu-1",
  fullName: "AIZA ARICOMA NELSY",
  subjects: [
    {
      classGroupId: "cg-lang",
      subjectName: "Comunicación y Lenguaje",
      trimester1: 10,
      trimester2: 10,
      trimester3: 100,
      average: 40,
    },
    {
      classGroupId: "cg-math",
      subjectName: "Matemática",
      trimester1: 1,
      trimester2: 10,
      trimester3: 10,
      average: 7,
    },
  ],
  trimesterAverages: [5.5, 10, 55],
  finalAverage: 23.5,
}

const joana: StudentAnnualSummary = {
  courseEnrollmentId: "enr-2",
  studentId: "stu-2",
  fullName: "ALVAREZ CRUZ JOANA",
  subjects: [
    {
      classGroupId: "cg-lang",
      subjectName: "Comunicación y Lenguaje",
      trimester1: 80,
      trimester2: 80,
      trimester3: 80,
      average: 80,
    },
    {
      classGroupId: "cg-math",
      subjectName: "Matemática",
      trimester1: null,
      trimester2: null,
      trimester3: 90,
      average: 90,
    },
  ],
  trimesterAverages: [80, 80, 85],
  finalAverage: 85,
}

function rowOf(name: string) {
  return screen.getByRole("row", { name: new RegExp(name, "i") })
}

describe("AnnualCentralizerTable", () => {
  it("heads every area with its three trimesters and the PR column", () => {
    render(<AnnualCentralizerTable rows={[nelsy]} />)

    // Two areas, so two blocks of 1 | 2 | 3 | PR.
    expect(screen.getAllByText("PR")).toHaveLength(2)
    expect(
      screen.getByRole("columnheader", { name: /Comunicación y Lenguaje/i })
    ).toBeInTheDocument()
    expect(screen.getByText(/PROMEDIO FINAL/i)).toBeInTheDocument()
    expect(screen.getByText(/SITUACIÓN FINAL/i)).toBeInTheDocument()
  })

  it("prints the area average the school's template produces", () => {
    render(<AnnualCentralizerTable rows={[nelsy]} />)

    const row = rowOf("AIZA ARICOMA NELSY")
    // 10, 10 and 100 give 40 — the worked example from their own sheet.
    expect(within(row).getByText("40.00")).toBeInTheDocument()
    expect(within(row).getByText("100.00")).toBeInTheDocument()
    // (40 + 7) / 2.
    expect(within(row).getByText("23.50")).toBeInTheDocument()
  })

  it("never rounds a mark up across the passing threshold", () => {
    // 50.6 rendered with no decimals reads as 51, which is exactly the passing mark. The sheet
    // would show a pass where the data says the student failed.
    render(
      <AnnualCentralizerTable
        rows={[
          {
            ...nelsy,
            subjects: [
              {
                classGroupId: "cg-lang",
                subjectName: "Comunicación y Lenguaje",
                trimester1: 50.6,
                trimester2: null,
                trimester3: null,
                average: 50.6,
              },
            ],
          },
        ]}
      />
    )

    const row = rowOf("AIZA ARICOMA NELSY")
    expect(within(row).getAllByText("50.60").length).toBeGreaterThan(0)
    expect(within(row).queryByText("51")).not.toBeInTheDocument()
  })

  it("renders a never-graded trimester as a dash, never as a zero", () => {
    render(<AnnualCentralizerTable rows={[joana]} />)

    const row = rowOf("ALVAREZ CRUZ JOANA")
    // Matemática starts in the third trimester: two empty cells, and no invented zeros.
    expect(within(row).getAllByText("—")).toHaveLength(2)
    expect(within(row).queryByText("0")).not.toBeInTheDocument()
  })

  it("keeps one column per area even when a student is missing it", () => {
    // A short row must never shrink the header for the whole page.
    render(
      <AnnualCentralizerTable
        rows={[
          { ...joana, subjects: [joana.subjects[0]] },
          nelsy,
        ]}
      />
    )

    expect(screen.getAllByText("PR")).toHaveLength(2)
  })

  it("says so when there is nothing to show", () => {
    render(<AnnualCentralizerTable rows={[]} />)

    expect(screen.getByText(/sin datos/i)).toBeInTheDocument()
  })
})

describe("TrimesterAveragesTable", () => {
  it("lays out the three trimesters and the final average", () => {
    render(<TrimesterAveragesTable rows={[nelsy]} />)

    expect(screen.getByText(/primer trimestre/i)).toBeInTheDocument()
    expect(screen.getByText(/segundo trimestre/i)).toBeInTheDocument()
    expect(screen.getByText(/tercer trimestre/i)).toBeInTheDocument()

    const row = rowOf("AIZA ARICOMA NELSY")
    expect(within(row).getByText("5.50")).toBeInTheDocument()
    expect(within(row).getByText("10.00")).toBeInTheDocument()
    expect(within(row).getByText("55.00")).toBeInTheDocument()
    expect(within(row).getByText("23.50")).toBeInTheDocument()
  })

  it("dashes a trimester with nothing graded yet", () => {
    render(
      <TrimesterAveragesTable
        rows={[{ ...nelsy, trimesterAverages: [5.5, null, null] }]}
      />
    )

    const row = rowOf("AIZA ARICOMA NELSY")
    expect(within(row).getAllByText("—")).toHaveLength(2)
  })
})

describe("AnnualRanking", () => {
  it("orders students by their annual average, best first", () => {
    // Handed worst-first on purpose: the sheet is titled "DE MAYOR A MENOR".
    render(<AnnualRanking rows={[nelsy, joana]} />)

    const names = screen
      .getAllByRole("row")
      .slice(1)
      .map((r) => r.textContent ?? "")

    expect(names[0]).toContain("ALVAREZ CRUZ JOANA")
    expect(names[1]).toContain("AIZA ARICOMA NELSY")
  })

  it("carries the qualitative band next to the average", () => {
    render(<AnnualRanking rows={[joana]} />)

    const row = rowOf("ALVAREZ CRUZ JOANA")
    expect(within(row).getByText("85.00")).toBeInTheDocument()
    expect(within(row).getByText(/desarrollo|óptimo|satisfactorio/i))
      .toBeInTheDocument()
  })

  it("sinks a student with no annual average to the bottom instead of treating it as a zero", () => {
    const ungraded: StudentAnnualSummary = {
      ...nelsy,
      courseEnrollmentId: "enr-3",
      fullName: "SIN NOTAS",
      finalAverage: null,
    }
    render(<AnnualRanking rows={[ungraded, nelsy]} />)

    const rows = screen.getAllByRole("row").slice(1)
    expect(rows[0].textContent).toContain("AIZA ARICOMA NELSY")
    expect(rows[1].textContent).toContain("SIN NOTAS")
    // Both the average and the situation stay blank: an unjudged year is not a failed one.
    expect(within(rows[1]).getAllByText("—")).toHaveLength(2)
    expect(within(rows[1]).getByText(/sin calificar/i)).toBeInTheDocument()
  })
})
