import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import type { ReportColumn } from "@/lib/tabularReportDocx"

const useAnnualCentralizer = vi.hoisted(() => vi.fn())
vi.mock("../hooks/useGradebook", () => ({ useAnnualCentralizer }))
vi.mock("@/features/institution/hooks/useInstitution", () => ({
  useInstitution: () => ({ data: undefined }),
}))

// The button builds a DOCX; here it only says which columns it was handed.
vi.mock("@/components/shared/ExportReportButton", async () => {
  const { createElement } = await import("react")
  return {
    ExportReportButton: ({
      columns,
      subtitles,
    }: {
      columns: ReportColumn[]
      subtitles: string[]
    }) =>
      createElement(
        "div",
        null,
        createElement(
          "p",
          null,
          `export:${columns.map((c) => c.header).join("|")}`
        ),
        createElement("p", null, `subtitles:${subtitles.join("|")}`)
      ),
  }
})

import { AnnualSheetsPanel } from "./AnnualSheetsPanel"
import type { StudentAnnualSummary } from "../types"

/**
 * The year-end panel of a technical teacher: their areas whole, and everything that spans every
 * subject (trimester averages, final average, final result) null from the API. None of it may show
 * up empty, on screen or in the document.
 */

const scoped: StudentAnnualSummary = {
  courseEnrollmentId: "enr-1",
  studentId: "stu-1",
  fullName: "AIZA ARICOMA NELSY",
  subjects: [
    {
      classGroupId: "cg-comp",
      subjectName: "Computación",
      trimester1: 70,
      trimester2: 80,
      trimester3: 90,
      average: 80,
    },
  ],
  trimesterAverages: [null, null, null],
  finalAverage: null,
  finalResult: null,
  frozen: false,
}

const page = (rows: StudentAnnualSummary[]) => ({
  data: { content: rows, page: 0, total: rows.length, totalPages: 1 },
  isLoading: false,
  isFetching: false,
})

describe("AnnualSheetsPanel", () => {
  it("keeps the three sheets and the course-wide export for the whole course", () => {
    useAnnualCentralizer.mockReturnValue(
      page([{ ...scoped, finalAverage: 80 }])
    )

    render(<AnnualSheetsPanel courseId="c-1" courseLabel="Primero A" />)

    expect(
      screen.getByRole("tab", { name: "Promedios por trimestre" })
    ).toBeInTheDocument()
    expect(screen.getByText(/aprobados/)).toBeInTheDocument()
    expect(screen.getByText(/\|Promedio final\|Estado$/)).toBeInTheDocument()
  })

  it("shows only the area sheet and exports only the areas for one subject", () => {
    useAnnualCentralizer.mockReturnValue(page([scoped]))

    render(
      <AnnualSheetsPanel courseId="c-1" courseLabel="Primero A" subjectOnly />
    )

    expect(screen.getByText("AIZA ARICOMA NELSY")).toBeInTheDocument()
    expect(
      screen.queryByRole("tab", { name: "Promedios por trimestre" })
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole("tab", { name: "Promedio anual" })
    ).not.toBeInTheDocument()
    expect(screen.queryByText(/sin calificar/)).not.toBeInTheDocument()
    expect(screen.queryByText(/reprobados/)).not.toBeInTheDocument()
    expect(
      screen.getByText("export:N°|Estudiante|Computación")
    ).toBeInTheDocument()
  })

  it("names the year in the document when it is known", () => {
    useAnnualCentralizer.mockReturnValue(page([scoped]))

    render(
      <AnnualSheetsPanel
        courseId="c-1"
        courseLabel="Primero A"
        year={2026}
        subjectOnly
      />
    )

    expect(
      screen.getByText(
        "subtitles:Curso: Primero A|Gestión 2026|Alcance anual · Solo las áreas del docente"
      )
    ).toBeInTheDocument()
  })

  it("leaves the year line out instead of a bare 'Gestión' when it is unknown", () => {
    useAnnualCentralizer.mockReturnValue(page([scoped]))

    render(
      <AnnualSheetsPanel courseId="c-1" courseLabel="Primero A" year={null} />
    )

    expect(
      screen.getByText("subtitles:Curso: Primero A|Alcance anual")
    ).toBeInTheDocument()
  })
})
