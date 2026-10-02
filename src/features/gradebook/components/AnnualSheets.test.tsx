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
  finalResult: null,
  frozen: false,
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
  finalResult: null,
  frozen: false,
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
        rows={[{ ...joana, subjects: [joana.subjects[0]] }, nelsy]}
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
    expect(
      within(row).getByText(/desarrollo|óptimo|satisfactorio/i)
    ).toBeInTheDocument()
  })

  it("judges the year by the mark the report card prints, not the raw average", () => {
    // 50.6 prints as 51 on the report card: approved. 50.49 prints as 50: failed.
    render(
      <AnnualRanking
        rows={[
          { ...nelsy, fullName: "SOBRE EL LIMITE", finalAverage: 50.6 },
          {
            ...nelsy,
            courseEnrollmentId: "enr-4",
            fullName: "BAJO EL LIMITE",
            finalAverage: 50.49,
          },
        ]}
      />
    )

    expect(within(rowOf("SOBRE EL LIMITE")).getByText(/Aprobado/)).toBeVisible()
    expect(within(rowOf("BAJO EL LIMITE")).getByText(/Reprobado/)).toBeVisible()
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

describe("AnnualCentralizerTable of a closed year", () => {
  const frozenNelsy = { ...nelsy, finalResult: "FAILED" as const, frozen: true }
  const frozenJoana = {
    ...joana,
    finalResult: "APPROVED" as const,
    frozen: true,
  }
  const withdrawn = {
    ...joana,
    courseEnrollmentId: "enr-3",
    fullName: "RETIRADO EVA",
    finalAverage: null,
    finalResult: null,
    frozen: true,
  }

  it("has a single situation column, never a separate Resultado one", () => {
    render(<AnnualCentralizerTable rows={[frozenNelsy, frozenJoana]} />)

    expect(
      screen.queryByRole("columnheader", { name: /^Resultado$/i })
    ).not.toBeInTheDocument()
    expect(
      screen.getAllByRole("columnheader", { name: /SITUACIÓN FINAL/i })
    ).toHaveLength(1)
  })

  it("shows the frozen outcome in the situation column", () => {
    render(<AnnualCentralizerTable rows={[frozenNelsy, frozenJoana]} />)

    expect(within(rowOf("NELSY")).getByText(/Reprobado/)).toBeInTheDocument()
    expect(within(rowOf("JOANA")).getByText(/Aprobado/)).toBeInTheDocument()
  })

  it("lets the frozen result override the computed average", () => {
    // Average 60 would pass, but the year closed with FAILED: the freeze is the last word.
    render(
      <AnnualCentralizerTable
        rows={[{ ...frozenNelsy, finalAverage: 60, finalResult: "FAILED" }]}
      />
    )

    expect(within(rowOf("NELSY")).getByText(/Reprobado/)).toBeInTheDocument()
  })

  it("shows a dash for a frozen row with no result", () => {
    render(<AnnualCentralizerTable rows={[frozenJoana, withdrawn]} />)

    expect(
      within(rowOf("RETIRADO")).queryByText(/APROBADO|REPROBADO/i)
    ).not.toBeInTheDocument()
    const cells = within(rowOf("RETIRADO")).getAllByRole("cell")
    expect(cells[cells.length - 1]).toHaveTextContent("—")
  })
})

describe("AnnualCentralizerTable of an open year", () => {
  it("judges 50.6 approved, as the report card prints 51", () => {
    render(<AnnualCentralizerTable rows={[{ ...nelsy, finalAverage: 50.6 }]} />)

    expect(within(rowOf("NELSY")).getByText(/Aprobado/)).toBeInTheDocument()
  })

  it("judges 50.49 failed, as the report card prints 50", () => {
    render(
      <AnnualCentralizerTable rows={[{ ...nelsy, finalAverage: 50.49 }]} />
    )

    expect(within(rowOf("NELSY")).getByText(/Reprobado/)).toBeInTheDocument()
  })
})

describe("TrimesterAveragesTable situation", () => {
  it("follows the annual rule and the freeze", () => {
    render(
      <TrimesterAveragesTable
        rows={[
          { ...nelsy, finalAverage: 50.6 },
          {
            ...joana,
            finalAverage: 60,
            finalResult: "FAILED",
            frozen: true,
          },
        ]}
      />
    )

    expect(within(rowOf("NELSY")).getByText(/Aprobado/)).toBeInTheDocument()
    expect(within(rowOf("JOANA")).getByText(/Reprobado/)).toBeInTheDocument()
  })
})
