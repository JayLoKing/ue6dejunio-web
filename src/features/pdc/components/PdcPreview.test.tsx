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
    criteriaDeciding: "Asume una postura",
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

  // The heading is filled in before a single subject is written, and a plan whose school has no
  // Director on record still has to render rather than break.
  it("renders before the school's heading has arrived", () => {
    render(<PdcPreview plan={plan({ subjects: [] })} />)

    expect(screen.getByText(/PLAN DE DESARROLLO CURRICULAR Nº 4/)).toBeInTheDocument()
  })
})
