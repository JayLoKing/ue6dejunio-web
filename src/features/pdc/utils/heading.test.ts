import { describe, expect, it } from "vitest"

import type { Pdc, PdcSubject } from "../types"
import { areaLine, spellDate, teacherLine, trimesterName } from "./heading"

const subject = (subjectName: string, knowledgeArea: string | null): PdcSubject =>
  ({ subjectName, knowledgeArea }) as PdcSubject

const plan = (over: Partial<Pdc>): Pdc => ({ subjects: [], ...over }) as Pdc

describe("areaLine", () => {
  // The filled-in form lists the SUBJECTS the teacher runs in the course, one per slot — seven for
  // a homeroom teacher whose technical subjects are taught by the technical teacher.
  it("lists the subjects the plan covers", () => {
    expect(
      areaLine(
        plan({
          subjects: [
            subject("Comunicación y Lenguajes", "Comunidad y Sociedad"),
            subject("Ciencias Sociales", "Comunidad y Sociedad"),
            subject("Matemática", "Ciencia Tecnología y Producción"),
          ],
        }),
      ),
    ).toBe("Comunicación y Lenguajes / Ciencias Sociales / Matemática")
  })

  // The technical teachers do not reach every course, so a homeroom teacher often runs Música and
  // Religión as well. Those are their subjects that month and the row grows from seven to nine.
  it("includes the technical subjects when the homeroom teacher also runs them", () => {
    const line = areaLine(
      plan({
        subjects: [
          subject("Matemática", "Ciencia Tecnología y Producción"),
          subject("Educación Musical", "Comunidad y Sociedad"),
          subject("Valores, Espiritualidad y Religiones", "Cosmos y Pensamiento"),
        ],
      }),
    )

    expect(line).toContain("Educación Musical")
    expect(line).toContain("Valores, Espiritualidad y Religiones")
  })

  it("leaves the row blank when the plan has no blocks yet", () => {
    expect(areaLine(plan({ subjects: [] }))).toBe("")
  })
})

describe("teacherLine", () => {
  // "Maestro/a" is the teacher in charge of the course, and only them. One teacher of the grade
  // writes the month and hands it to the parallels; the copy belongs to whoever runs the course it
  // lands in, so the name follows the course rather than the writing.
  it("names the teacher in charge of the course", () => {
    expect(teacherLine(plan({ homeroomTeacherName: "Ana Pérez" }))).toBe("Ana Pérez")
  })

  it("leaves the line blank when there is nobody to name", () => {
    expect(teacherLine(plan({ homeroomTeacherName: null }))).toBe("")
  })
})

describe("spellDate", () => {
  // The form writes "Del: 03 de agosto al: 04 de septiembre" — never a numeric date.
  it("spells the month out and pads the day", () => {
    expect(spellDate("2026-08-03")).toBe("03 de agosto")
    expect(spellDate("2026-09-04")).toBe("04 de septiembre")
  })

  it("returns nothing for a date that is not there", () => {
    expect(spellDate(null)).toBe("")
  })
})

describe("trimesterName", () => {
  it("names the trimester the way the form does", () => {
    expect(trimesterName(1)).toBe("Primer")
    expect(trimesterName(3)).toBe("Tercer")
  })

  it("prints the number itself for anything outside the three", () => {
    expect(trimesterName(4)).toBe("4")
  })
})
