import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { PdcPreview } from "./PdcPreview"
import type { Pdc, PdcEntry, PdcSubject } from "../types"
import type { Adaptation } from "@/features/adaptation/types"

const adaptation = (over: Partial<Adaptation> = {}): Adaptation =>
  ({
    id: "a-1",
    planId: "p-1",
    studentId: "st-1",
    studentName: "Juan Vargas",
    conditionType: "TEA",
    adaptedContents: "Números hasta el 20",
    adaptedMethodology: "Material concreto",
    adaptedCriteria: "Cuenta con apoyo",
    createdById: null,
    updatedById: null,
    createdAt: "2026-08-03T00:00:00",
    updatedAt: "2026-08-03T00:00:00",
    ...over,
  }) as Adaptation

const week = (over: Partial<PdcEntry> = {}): PdcEntry =>
  ({
    id: "e-1",
    weekLabel: "Semana 1",
    contents: "T 7 La poesía",
    practice: "Leemos",
    theory: "Explicamos",
    valuation: "Valoramos",
    production: "Esquema",
    resources: "Periódicos",
    periods: 11,
    criteriaBeing: "Respeta opiniones",
    criteriaKnowing: "Reconoce la estructura",
    criteriaDoing: "Elabora un esquema",
    displayOrder: 0,
    ...over,
  }) as PdcEntry

const subject = (over: Partial<PdcSubject> = {}): PdcSubject =>
  ({
    id: "s-1",
    classGroupId: "cg-1",
    subjectName: "Comunicación y Lenguajes",
    knowledgeArea: "Comunidad y Sociedad",
    teacherId: "t-1",
    teacherName: "Ana Pérez",
    learningObjective: "Desarrollamos la lectura comprensiva.",
    generalAdaptations: "Material manipulable.",
    displayOrder: 0,
    entries: [week()],
    ...over,
  }) as PdcSubject

const plan = (over: Partial<Pdc> = {}): Pdc =>
  ({
    id: "p-1",
    planNumber: 4,
    trimester: 2,
    periodStart: "2026-08-03",
    periodEnd: "2026-09-04",
    status: "Draft",
    courseName: 'Quinto "B"',
    levelName: "Primaria Comunitaria Vocacional",
    homeroomTeacherName: "Ana Pérez",
    holisticObjective: "Fortalecemos la práctica de valores.",
    finalProduct: null,
    bibliography: null,
    subjects: [subject()],
    ...over,
  }) as Pdc

describe("PdcPreview", () => {
  // The official form evaluates on three criteria. The database keeps a fourth because the rest of
  // the system grades on it, but printing it here would be a column the form does not have.
  it("prints the three criteria of the form and not the fourth", () => {
    render(<PdcPreview plan={plan()} />)

    expect(screen.getByText(/SER:/)).toBeInTheDocument()
    expect(screen.getByText(/SABER:/)).toBeInTheDocument()
    expect(screen.getByText(/HACER:/)).toBeInTheDocument()
    expect(screen.queryByText(/DECIDIR:/)).not.toBeInTheDocument()
  })

  it("heads the reference table with the district, the school and the Director", () => {
    render(
      <PdcPreview
        plan={plan()}
        institution={{
          district: "Sacaba",
          school: 'Unidad Educativa "6 de Junio"',
          directorName: "Luis Rojas",
          // The PDC prints none of these four; the libreta and the informe pedagógico do, and the
          // heading is one object for all of them.
          department: "Cochabamba",
          dependency: "Fiscal",
          shift: "Mañana",
          educationLevel: "Educación Primaria Comunitaria Vocacional",
        }}
      />
    )

    expect(screen.getByText("Sacaba")).toBeInTheDocument()
    expect(
      screen.getByText('Unidad Educativa "6 de Junio"')
    ).toBeInTheDocument()
    expect(screen.getByText("Luis Rojas")).toBeInTheDocument()
  })

  // The subject belongs inside the shaded band with its area, centred, the way the handed-in form
  // heads each table. It used to sit outside the band, left-aligned on white.
  it("prints the subject inside the area's band", () => {
    render(<PdcPreview plan={plan()} />)

    // The name also fills the "Áreas" row of the reference table, so the band is the one to look at.
    const band = screen
      .getAllByText("Comunicación y Lenguajes")
      .map((node) => node.closest(".pdc-band"))
      .find((node) => node !== null)

    expect(band).toBeDefined()
    expect(band).toHaveTextContent(
      "Área de saberes y conocimiento: Comunidad y Sociedad"
    )
    expect(band).toHaveClass("text-center")
  })

  // The band and the columns are one frame. As two elements they drew two borders with a gap
  // between them; the band has to be a row of the very table it heads.
  it("draws the band as a row of the block's own table", () => {
    render(<PdcPreview plan={plan()} />)

    const band = screen
      .getAllByText("Comunicación y Lenguajes")
      .map((node) => node.closest(".pdc-band"))
      .find((node) => node !== null)!
    const heading = screen.getByText("Objetivo de aprendizaje")

    expect(band.tagName).toBe("TH")
    expect(band).toHaveAttribute("colspan", "6")
    expect(band.closest("table")).toBe(heading.closest("table"))
  })

  // Four subjects of one area are four headed tables, not one heading over four tables: the form
  // repeats the area on every block it covers.
  it("repeats the area over every subject it covers", () => {
    render(
      <PdcPreview
        plan={plan({
          subjects: [
            subject(),
            subject({
              id: "s-2",
              subjectName: "Ciencias Sociales",
              displayOrder: 1,
            }),
          ],
        })}
      />
    )

    expect(
      screen.getAllByText(
        "Área de saberes y conocimiento: Comunidad y Sociedad"
      )
    ).toHaveLength(2)
  })

  // The parenthetical naming who the row is for is guidance for filling the form, not part of the
  // document. It moved to the field in the wizard.
  it("prints the adaptations title without the template's parenthetical", () => {
    render(<PdcPreview plan={plan()} />)

    expect(screen.getByText("ADAPTACIONES CURRICULARES")).toBeInTheDocument()
    expect(
      screen.queryByText(/dificultades en el aprendizaje/)
    ).not.toBeInTheDocument()
  })

  // The template sets both labels in bold; they read as labels rather than as part of the date.
  it("sets the period labels in bold", () => {
    render(<PdcPreview plan={plan()} />)

    expect(screen.getByText("Del:")).toHaveClass("font-bold")
    expect(screen.getByText("al:")).toHaveClass("font-bold")
    expect(screen.getByText("03 de agosto")).toBeInTheDocument()
    expect(screen.getByText("04 de septiembre")).toBeInTheDocument()
  })

  // The columns are the template's, in the template's order: what was adapted, who it answers to,
  // how it was adapted, how it is judged.
  it("prints one row per significant adaptation, in the form's column order", () => {
    render(<PdcPreview plan={plan()} adaptations={[adaptation()]} />)

    const row = screen.getByText("Números hasta el 20").closest("tr")!

    expect(Array.from(row.cells).map((cell) => cell.textContent)).toEqual([
      "Números hasta el 20",
      "TEA",
      "Material concreto",
      "Cuenta con apoyo",
    ])
  })

  it("prints a row for every student the teacher adapted for", () => {
    render(
      <PdcPreview
        plan={plan()}
        adaptations={[
          adaptation(),
          adaptation({ id: "a-2", adaptedContents: "Lectura de sílabas" }),
        ]}
      />
    )

    const table = screen.getByText("Adaptación").closest("table")!

    expect(table.tBodies[0].rows).toHaveLength(2)
  })

  // The form is handed in on paper. A month with no adaptation still prints the empty row the
  // teacher writes on by hand, which is what the blank template does.
  it("keeps the blank row when no adaptation was written", () => {
    render(<PdcPreview plan={plan()} adaptations={[]} />)

    const table = screen.getByText("Adaptación").closest("table")!

    expect(table.tBodies[0].rows).toHaveLength(1)
    expect(table.tBodies[0].rows[0].textContent).toBe("")
  })

  // A teacher who filled only the content leaves the other columns empty. They print as the form's
  // own blank cell — never as the word "null".
  it("leaves an unfilled column blank rather than printing its absence", () => {
    render(
      <PdcPreview
        plan={plan()}
        adaptations={[
          adaptation({ conditionType: null, adaptedCriteria: null }),
        ]}
      />
    )

    const row = screen.getByText("Números hasta el 20").closest("tr")!

    expect(Array.from(row.cells).map((cell) => cell.textContent)).toEqual([
      "Números hasta el 20",
      "",
      "Material concreto",
      "",
    ])
  })

  // The preview is opened while the adaptations are still being fetched, and every plan written
  // before this step existed has none at all.
  it("renders the blank row when no adaptations were passed at all", () => {
    render(<PdcPreview plan={plan()} />)

    const table = screen.getByText("Adaptación").closest("table")!

    expect(table.tBodies[0].rows).toHaveLength(1)
  })

  // The heading is filled in before a single subject is written, and a plan whose school has no
  // Director on record still has to render rather than break.
  it("renders before the school's heading has arrived", () => {
    render(<PdcPreview plan={plan({ subjects: [] })} />)

    expect(
      screen.getByText(/PLAN DE DESARROLLO CURRICULAR Nº 4/)
    ).toBeInTheDocument()
  })
})
