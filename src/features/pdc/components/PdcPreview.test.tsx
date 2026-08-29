import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { PdcPreview } from "./PdcPreview"
import type { Pdc, PdcEntry, PdcSubject } from "../types"

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
    teacherNames: ["Ana Pérez"],
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
        }}
      />,
    )

    expect(screen.getByText("Sacaba")).toBeInTheDocument()
    expect(screen.getByText('Unidad Educativa "6 de Junio"')).toBeInTheDocument()
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
    expect(band).toHaveTextContent("Área de saberes y conocimiento: Comunidad y Sociedad")
    expect(band).toHaveClass("text-center")
  })

  // Four subjects of one area are four headed tables, not one heading over four tables: the form
  // repeats the area on every block it covers.
  it("repeats the area over every subject it covers", () => {
    render(
      <PdcPreview
        plan={plan({
          subjects: [
            subject(),
            subject({ id: "s-2", subjectName: "Ciencias Sociales", displayOrder: 1 }),
          ],
        })}
      />,
    )

    expect(
      screen.getAllByText("Área de saberes y conocimiento: Comunidad y Sociedad"),
    ).toHaveLength(2)
  })

  // The parenthetical naming who the row is for is guidance for filling the form, not part of the
  // document. It moved to the field in the wizard.
  it("prints the adaptations title without the template's parenthetical", () => {
    render(<PdcPreview plan={plan()} />)

    expect(screen.getByText("ADAPTACIONES CURRICULARES")).toBeInTheDocument()
    expect(screen.queryByText(/dificultades en el aprendizaje/)).not.toBeInTheDocument()
  })

  // The template sets both labels in bold; they read as labels rather than as part of the date.
  it("sets the period labels in bold", () => {
    render(<PdcPreview plan={plan()} />)

    expect(screen.getByText("Del:")).toHaveClass("font-bold")
    expect(screen.getByText("al:")).toHaveClass("font-bold")
    expect(screen.getByText("03 de agosto")).toBeInTheDocument()
    expect(screen.getByText("04 de septiembre")).toBeInTheDocument()
  })

  // The heading is filled in before a single subject is written, and a plan whose school has no
  // Director on record still has to render rather than break.
  it("renders before the school's heading has arrived", () => {
    render(<PdcPreview plan={plan({ subjects: [] })} />)

    expect(screen.getByText(/PLAN DE DESARROLLO CURRICULAR Nº 4/)).toBeInTheDocument()
  })
})
