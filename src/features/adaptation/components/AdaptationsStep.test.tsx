import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { AdaptationsStep } from "./AdaptationsStep"
import type { Adaptation } from "../types"
import type { CourseStudent } from "@/features/courses/types/course"

const student = (id: string, fullName: string): CourseStudent =>
  ({
    courseEnrollmentId: `ce-${id}`,
    studentId: id,
    rudeCode: `RUDE-${id}`,
    identityCard: `CI-${id}`,
    fullName,
    status: "Effective",
  }) as CourseStudent

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

const props = (over: Partial<Parameters<typeof AdaptationsStep>[0]> = {}) => ({
  planId: "p-1",
  students: [student("st-1", "Juan Vargas"), student("st-2", "Rosa Quispe")],
  adaptations: [],
  saving: false,
  onAdd: vi.fn(),
  onUpdate: vi.fn(),
  onRemove: vi.fn(),
  onBack: vi.fn(),
  onNext: vi.fn(),
  ...over,
})

describe("AdaptationsStep", () => {
  // Not every month has a student in this situation. A teacher who has none has to be able to walk
  // past the step rather than look for something to write.
  it("says the step can be left empty", () => {
    render(<AdaptationsStep {...props()} />)

    expect(screen.getByText(/opcional/i)).toBeInTheDocument()
  })

  it("moves on without writing anything", async () => {
    const p = props()
    render(<AdaptationsStep {...p} />)

    await userEvent.click(screen.getByRole("button", { name: /continuar/i }))

    expect(p.onNext).toHaveBeenCalled()
  })

  // The server keeps one adaptation per plan and student. Offering a student who already has one
  // sends the teacher into a 409 they did nothing to earn.
  it("offers only the students who have no adaptation yet", async () => {
    render(
      <AdaptationsStep
        {...props({ adaptations: [adaptation({ studentId: "st-1" })] })}
      />
    )

    await userEvent.click(screen.getByRole("combobox", { name: /estudiante/i }))

    expect(
      screen.getByRole("option", { name: "Rosa Quispe" })
    ).toBeInTheDocument()
    expect(
      screen.queryByRole("option", { name: "Juan Vargas" })
    ).not.toBeInTheDocument()
  })

  it("sends the chosen student with the four columns of the form", async () => {
    const p = props()
    render(<AdaptationsStep {...p} />)

    await userEvent.click(screen.getByRole("combobox", { name: /estudiante/i }))
    await userEvent.click(screen.getByRole("option", { name: "Rosa Quispe" }))
    await userEvent.type(
      screen.getByLabelText(/contenido/i),
      "Números hasta el 20"
    )
    await userEvent.type(screen.getByLabelText(/discapacidad/i), "TEA")
    await userEvent.type(
      screen.getByLabelText(/^adaptación/i),
      "Material concreto"
    )
    await userEvent.type(screen.getByLabelText(/criterio/i), "Cuenta con apoyo")
    await userEvent.click(screen.getByRole("button", { name: /agregar/i }))

    expect(p.onAdd).toHaveBeenCalledWith({
      id_curriculum_plan: "p-1",
      id_student: "st-2",
      adaptedContents: "Números hasta el 20",
      conditionType: "TEA",
      adaptedMethodology: "Material concreto",
      adaptedCriteria: "Cuenta con apoyo",
    })
  })

  // A row without a student belongs to nobody. The server refuses it, so the form does not send it.
  it("does not send a row before a student is chosen", async () => {
    const p = props()
    render(<AdaptationsStep {...p} />)

    await userEvent.type(
      screen.getByLabelText(/contenido/i),
      "Números hasta el 20"
    )
    await userEvent.click(screen.getByRole("button", { name: /agregar/i }))

    expect(p.onAdd).not.toHaveBeenCalled()
  })

  // The printed form names the condition, not the child. On screen the teacher needs the name, or
  // they cannot tell which row belongs to whom.
  it("names the student on every adaptation already written", () => {
    render(<AdaptationsStep {...props({ adaptations: [adaptation()] })} />)

    expect(screen.getByText("Juan Vargas")).toBeInTheDocument()
    expect(screen.getByText(/Números hasta el 20/)).toBeInTheDocument()
  })

  it("removes the adaptation the teacher discards", async () => {
    const p = props({ adaptations: [adaptation()] })
    render(<AdaptationsStep {...p} />)

    await userEvent.click(screen.getByRole("button", { name: /quitar/i }))

    expect(p.onRemove).toHaveBeenCalledWith("a-1")
  })

  // A diagnosis gets corrected after the plan is written. Without an edit the only way to fix a
  // typo is to delete the row and type all four columns again.
  it("opens a written row with what it already holds", async () => {
    render(<AdaptationsStep {...props({ adaptations: [adaptation()] })} />)

    await userEvent.click(screen.getByRole("button", { name: /editar/i }))

    expect(screen.getByLabelText(/contenido/i)).toHaveValue(
      "Números hasta el 20"
    )
    expect(screen.getByLabelText(/discapacidad/i)).toHaveValue("TEA")
    expect(screen.getByLabelText(/^adaptación/i)).toHaveValue(
      "Material concreto"
    )
    expect(screen.getByLabelText(/criterio/i)).toHaveValue("Cuenta con apoyo")
  })

  it("saves the corrected row", async () => {
    const p = props({ adaptations: [adaptation()] })
    render(<AdaptationsStep {...p} />)

    await userEvent.click(screen.getByRole("button", { name: /editar/i }))
    await userEvent.clear(screen.getByLabelText(/discapacidad/i))
    await userEvent.type(screen.getByLabelText(/discapacidad/i), "TDH")
    await userEvent.click(screen.getByRole("button", { name: /guardar/i }))

    expect(p.onUpdate).toHaveBeenCalledWith({
      id: "a-1",
      payload: {
        conditionType: "TDH",
        adaptedContents: "Números hasta el 20",
        adaptedMethodology: "Material concreto",
        adaptedCriteria: "Cuenta con apoyo",
      },
    })
  })

  // An emptied box means the teacher wants the column gone. The API reads null as "leave it", so
  // the edit sends the empty string instead — otherwise clearing a column silently does nothing.
  it("clears a column the teacher emptied", async () => {
    const p = props({ adaptations: [adaptation()] })
    render(<AdaptationsStep {...p} />)

    await userEvent.click(screen.getByRole("button", { name: /editar/i }))
    await userEvent.clear(screen.getByLabelText(/criterio/i))
    await userEvent.click(screen.getByRole("button", { name: /guardar/i }))

    expect(p.onUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        payload: expect.objectContaining({ adaptedCriteria: "" }),
      })
    )
  })

  it("leaves the row alone when the edit is cancelled", async () => {
    const p = props({ adaptations: [adaptation()] })
    render(<AdaptationsStep {...p} />)

    await userEvent.click(screen.getByRole("button", { name: /editar/i }))
    await userEvent.clear(screen.getByLabelText(/discapacidad/i))
    await userEvent.click(screen.getByRole("button", { name: /cancelar/i }))

    expect(p.onUpdate).not.toHaveBeenCalled()
    expect(screen.getByRole("button", { name: /editar/i })).toBeInTheDocument()
  })

  // Editing and adding at once would put two sets of the same four labels on screen, and the
  // teacher would not know which one the buttons act on.
  it("puts the new-adaptation form away while a row is being edited", async () => {
    render(<AdaptationsStep {...props({ adaptations: [adaptation()] })} />)

    await userEvent.click(screen.getByRole("button", { name: /editar/i }))

    expect(
      screen.queryByRole("button", { name: /agregar/i })
    ).not.toBeInTheDocument()
  })

  // Every student of the course already has a row: there is nothing left to add, and an empty
  // selector with no explanation reads as a broken form.
  it("says so when no student is left to adapt for", () => {
    render(
      <AdaptationsStep
        {...props({
          adaptations: [
            adaptation({ studentId: "st-1" }),
            adaptation({
              id: "a-2",
              studentId: "st-2",
              studentName: "Rosa Quispe",
            }),
          ],
        })}
      />
    )

    expect(
      screen.getByText(/todos los estudiantes del curso/i)
    ).toBeInTheDocument()
  })
})
