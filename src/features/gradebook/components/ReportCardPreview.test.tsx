import { render, screen, within } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import type { Institution } from "@/features/institution/types"

import { ReportCardPreview } from "./ReportCardPreview"
import type { StudentReportCard } from "../types"

/**
 * The libreta as the school prints it. Presentational: every number is the API's.
 *
 * <p>What these tests hold is the shape of a document a parent signs — that the RUDE is on it,
 * that a mark nobody wrote is not a zero, and that the areas passed and failed are the ones the
 * API counted rather than a tally this component invents from the rows it happens to be drawing.
 */

const school: Institution = {
  district: "Sacaba",
  school: 'Unidad Educativa "6 de Junio"',
  directorName: "Juan Perez",
  department: "Cochabamba",
  dependency: "Fiscal",
  shift: "Mañana",
  educationLevel: "Educación Primaria Comunitaria Vocacional",
}

const card: StudentReportCard = {
  courseEnrollmentId: "enr-1",
  studentId: "stu-1",
  rudeCode: "7042002820239055",
  fullName: "NELSY AIZA ARICOMA",
  gradeName: "2do",
  parallelName: "C",
  year: 2026,
  fields: [
    {
      fieldName: "Comunidad y Sociedad",
      displayOrder: 1,
      areas: [
        {
          classGroupId: "cg-lang",
          subjectName: "Comunicación y Lenguajes",
          trimester1: 80,
          trimester2: 80,
          trimester3: 80,
          average: 80,
        },
      ],
    },
    {
      fieldName: "Ciencia Tecnología y Producción",
      displayOrder: 2,
      areas: [
        {
          classGroupId: "cg-math",
          subjectName: "Matemática",
          trimester1: 60,
          trimester2: null,
          trimester3: null,
          average: 60,
        },
      ],
    },
  ],
  trimesterAverages: [70, 80, 80],
  finalAverage: 70,
  finalAverageInWords: "Setenta",
  trimesterOutcomes: [
    { trimester: 1, passedAreas: 2, failedAreas: 0 },
    { trimester: 2, passedAreas: 1, failedAreas: 0 },
    { trimester: 3, passedAreas: 1, failedAreas: 0 },
  ],
}

describe("ReportCardPreview", () => {
  it("heads the sheet with the school and the student it names", () => {
    render(<ReportCardPreview card={card} school={school} />)

    expect(screen.getByText(/6 de Junio/)).toBeInTheDocument()
    expect(screen.getByText(/Cochabamba/)).toBeInTheDocument()
    expect(screen.getByText(/Sacaba/)).toBeInTheDocument()
    expect(
      screen.getByText(/Educación Primaria Comunitaria Vocacional/)
    ).toBeInTheDocument()
    // The RUDE identifies the student above their own name; a libreta without it is not one.
    expect(screen.getByText("7042002820239055")).toBeInTheDocument()
    expect(screen.getByText("NELSY AIZA ARICOMA")).toBeInTheDocument()
    expect(screen.getByText(/2026/)).toBeInTheDocument()
  })

  it("groups the areas under their field of knowledge, in sheet order", () => {
    render(<ReportCardPreview card={card} school={school} />)

    const rows = screen.getAllByRole("row").map((r) => r.textContent ?? "")
    const community = rows.findIndex((r) => r.includes("Comunidad y Sociedad"))
    const science = rows.findIndex((r) =>
      r.includes("Ciencia Tecnología y Producción")
    )
    const maths = rows.findIndex((r) => r.includes("Matemática"))

    expect(community).toBeGreaterThanOrEqual(0)
    // Each field heads the areas that hang under it, in the order the school's sheet reads.
    expect(community).toBeLessThan(science)
    expect(science).toBeLessThan(maths)
  })

  it("prints a never-graded trimester as a blank, never as a zero", () => {
    render(<ReportCardPreview card={card} school={school} />)

    const row = screen.getByRole("row", { name: /Matemática/ })
    // Two trimesters the subject was never marked in.
    expect(within(row).getAllByText("—")).toHaveLength(2)
    expect(within(row).queryByText("0")).not.toBeInTheDocument()
  })

  it("carries the annual average as a figure and spelled out", () => {
    render(<ReportCardPreview card={card} school={school} />)

    const row = screen.getByRole("row", { name: /Promedio Trimestral/ })
    const cells = within(row).getAllByRole("cell")
    expect(cells[cells.length - 1]).toHaveTextContent("70")
    expect(
      screen.getByText(/Promedio Anual \(literal\)/).parentElement
    ).toHaveTextContent("Setenta")
  })

  it("reports the failed-area counts the API sent, not its own tally", () => {
    // The two do not have to add up to the number of areas: one with no mark that trimester was
    // never judged. A component recounting the rows it draws would call those failed.
    render(
      <ReportCardPreview
        card={{
          ...card,
          trimesterOutcomes: [
            { trimester: 1, passedAreas: 1, failedAreas: 1 },
            { trimester: 2, passedAreas: 1, failedAreas: 0 },
            { trimester: 3, passedAreas: 0, failedAreas: 0 },
          ],
        }}
        school={school}
      />
    )

    const row = screen.getByRole("row", { name: /Total de Áreas Reprobadas/i })
    // The label, the three trimesters, and the empty cell under the annual column.
    const cells = within(row).getAllByRole("cell")
    expect(cells.slice(1, 4).map((c) => c.textContent)).toEqual(["1", "0", "0"])
  })

  it("leaves the literal blank rather than spelling a mark nobody gave", () => {
    render(
      <ReportCardPreview
        card={{
          ...card,
          fields: [],
          trimesterAverages: [null, null, null],
          finalAverage: null,
          finalAverageInWords: "",
        }}
        school={school}
      />
    )

    // The label stays on the sheet; what must not appear is a word for a mark nobody gave.
    const literal = screen.getByText(/Promedio Anual \(literal\)/).parentElement
    expect(literal).toHaveTextContent("Promedio Anual (literal):")
    expect(
      literal?.textContent?.replace("Promedio Anual (literal):", "").trim()
    ).toBe("")

    const row = screen.getByRole("row", { name: /Promedio Trimestral/ })
    const cells = within(row).getAllByRole("cell")
    expect(cells[cells.length - 1]).toHaveTextContent("—")
  })

  it("leaves the Director's signature line blank while nobody holds the role", () => {
    render(
      <ReportCardPreview
        card={card}
        school={{ ...school, directorName: null }}
      />
    )

    // The paper form leaves the line for a signature either way; what it must not do is print a
    // name for somebody who is not in office.
    expect(screen.getByText(/Firma del Director/i)).toBeInTheDocument()
    expect(screen.queryByText("Juan Perez")).not.toBeInTheDocument()
  })
})
