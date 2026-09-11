import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { RiskTable } from "./RiskTable"
import type { StudentRisk } from "../types/risk"

const risk = (over: Partial<StudentRisk> = {}): StudentRisk => ({
  id: "rp-1",
  studentId: "st-1",
  studentName: "Ana Quispe",
  classGroupId: "cg-1",
  subjectName: "Matemática",
  trimester: 1,
  riskLevel: "RiesgoCritico",
  pFail: 0.8723,
  pOutstanding: 0.0102,
  attended: false,
  predictedAt: "2026-09-11T10:00:00",
  ...over,
})

describe("RiskTable", () => {
  it("names the student and the subject instead of the ids behind them", () => {
    render(<RiskTable rows={[risk()]} />)

    expect(screen.getByText("Ana Quispe")).toBeInTheDocument()
    expect(screen.getByText("Matemática")).toBeInTheDocument()
    expect(screen.getByText("87.2%")).toBeInTheDocument()
    expect(screen.getByText("Riesgo crítico")).toBeInTheDocument()
  })

  /** A run that predicted nobody and a subject nobody teaches look the same without this. */
  it("says the listing is empty rather than drawing an empty table", () => {
    render(<RiskTable rows={[]} />)

    expect(screen.getByText(/Sin predicciones/)).toBeInTheDocument()
  })

  /**
   * The subject column only earns its place where the listing spans more than one. A teacher
   * reading their own subject does not need it repeated down thirty rows.
   */
  it("drops the subject column when every row is the same subject", () => {
    render(<RiskTable rows={[risk()]} hideSubject />)

    expect(
      screen.queryByRole("columnheader", { name: "Materia" })
    ).not.toBeInTheDocument()
    expect(screen.getByText("Ana Quispe")).toBeInTheDocument()
  })

  /**
   * Marking a prediction as handled is a write the API guards through the subject. Without the
   * callback the table is read-only, which is what a listing spanning subjects the reader does
   * not teach has to be.
   */
  it("offers no action when the reader cannot act on the prediction", () => {
    render(<RiskTable rows={[risk()]} />)

    expect(
      screen.queryByRole("button", { name: /atendid/i })
    ).not.toBeInTheDocument()
  })

  it("hands back the prediction and the new flag when the reader acts on it", async () => {
    const onToggleAttended = vi.fn()
    render(<RiskTable rows={[risk()]} onToggleAttended={onToggleAttended} />)

    await userEvent.click(
      screen.getByRole("button", {
        name: /Marcar como atendida la predicción de Ana Quispe/,
      })
    )

    expect(onToggleAttended).toHaveBeenCalledWith(
      expect.objectContaining({ id: "rp-1" }),
      true
    )
  })

  it("offers to undo on one already handled", async () => {
    const onToggleAttended = vi.fn()
    render(
      <RiskTable
        rows={[risk({ attended: true })]}
        onToggleAttended={onToggleAttended}
      />
    )

    await userEvent.click(
      screen.getByRole("button", {
        name: /Marcar como pendiente la predicción de Ana Quispe/,
      })
    )

    expect(onToggleAttended).toHaveBeenCalledWith(
      expect.objectContaining({ id: "rp-1" }),
      false
    )
  })

  /**
   * Only the failing category is worth acting on. `EnRiesgo` is the largest group in the training
   * data, so offering the action on it would hand a teacher a to-do list of most of their course.
   */
  it("offers the action only where the model is actually calling for one", () => {
    render(
      <RiskTable
        rows={[risk({ id: "rp-2", riskLevel: "EnRiesgo" })]}
        onToggleAttended={vi.fn()}
      />
    )

    expect(
      screen.queryByRole("button", { name: /atendid/i })
    ).not.toBeInTheDocument()
  })

  /**
   * A course listing spans every subject in it, and a homeroom teacher does not necessarily take
   * the technical ones — the API guards the write through the prediction's own subject and answers
   * 403 for the rest. An offered button that always fails is worse than no button, so the caller
   * says which subjects are theirs and the rest stay read-only inside the same table.
   */
  it("offers the action only on the subjects the reader actually teaches", () => {
    render(
      <RiskTable
        rows={[
          risk({ id: "rp-1", classGroupId: "mine", studentName: "Ana Quispe" }),
          risk({
            id: "rp-2",
            classGroupId: "someone-else",
            studentName: "Luis Mamani",
            subjectName: "Música",
          }),
        ]}
        onToggleAttended={vi.fn()}
        canAttend={(r) => r.classGroupId === "mine"}
      />
    )

    expect(
      screen.getByRole("button", {
        name: /Marcar como atendida la predicción de Ana Quispe/,
      })
    ).toBeInTheDocument()
    expect(
      screen.queryByRole("button", { name: /la predicción de Luis Mamani/ })
    ).not.toBeInTheDocument()
  })

  /**
   * The API answers worst first, and re-sorting client-side would fight that order for no gain.
   * This pins it: a caller that merges two listings gets them ranked, not interleaved by arrival.
   */
  it("keeps the worst first when a listing merges several subjects", () => {
    render(
      <RiskTable
        rows={[
          risk({
            id: "a",
            studentName: "Luis Mamani",
            riskLevel: "Sobresaliente",
            pFail: 0.01,
          }),
          risk({
            id: "b",
            studentName: "Ana Quispe",
            riskLevel: "RiesgoCritico",
            pFail: 0.87,
          }),
          risk({
            id: "c",
            studentName: "Sara Vaca",
            riskLevel: "EnRiesgo",
            pFail: 0.4,
          }),
        ]}
      />
    )

    const names = screen
      .getAllByRole("row")
      .slice(1)
      .map((row) => within(row).getAllByRole("cell")[0].textContent)

    expect(names).toEqual(["Ana Quispe", "Sara Vaca", "Luis Mamani"])
  })
})
