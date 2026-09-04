import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { WithdrawStudentDialog } from "./WithdrawStudentDialog"

const mutate = vi.fn()

// The mutation is stubbed so these tests are about the rule the form enforces, not about
// react-query: what reaches the API is asserted through the payload it was handed.
vi.mock("../hooks/useStudentDirectory", () => ({
  useWithdrawStudent: () => ({ mutate, isPending: false }),
}))

const student = { id: "st-1", fullName: "Ana Quispe" }

const openOn = (over: Partial<typeof student> = {}) =>
  render(
    <WithdrawStudentDialog
      student={{ ...student, ...over }}
      onClose={vi.fn()}
    />
  )

describe("WithdrawStudentDialog", () => {
  beforeEach(() => mutate.mockClear())

  it("names who is about to leave the roll", () => {
    openOn()

    expect(screen.getByText(/Ana Quispe/)).toBeInTheDocument()
  })

  /** The first reason already says what happened, so the note stays optional. */
  it("sends a categorised withdrawal without a note", async () => {
    openOn()

    await userEvent.click(screen.getByRole("button", { name: "Dar de baja" }))

    expect(mutate).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "st-1",
        payload: { reason: "Retiro Voluntario" },
      }),
      expect.anything()
    )
  })

  /**
   * "Otro" is the category for a reason this list does not have, so on its own it says nothing.
   * The API answers 400 without the note; refusing here means nobody has to learn that by
   * bouncing off it.
   */
  it("will not send an open reason with nothing behind it", async () => {
    openOn()

    await userEvent.click(screen.getByRole("combobox"))
    await userEvent.click(screen.getByRole("option", { name: "Otro" }))

    expect(screen.getByRole("button", { name: "Dar de baja" })).toBeDisabled()
    expect(
      screen.getByText(/exige decir cuál es/i)
    ).toBeInTheDocument()
    expect(mutate).not.toHaveBeenCalled()
  })

  it("sends the open reason once it has its own words", async () => {
    openOn()

    await userEvent.click(screen.getByRole("combobox"))
    await userEvent.click(screen.getByRole("option", { name: "Otro" }))
    await userEvent.type(
      screen.getByRole("textbox"),
      "  Se mudó a Santa Cruz.  "
    )
    await userEvent.click(screen.getByRole("button", { name: "Dar de baja" }))

    expect(mutate).toHaveBeenCalledWith(
      expect.objectContaining({
        payload: { reason: "Otro", note: "Se mudó a Santa Cruz." },
      }),
      expect.anything()
    )
  })

  /** Whitespace is not an explanation. */
  it("does not accept spaces as the words behind the open reason", async () => {
    openOn()

    await userEvent.click(screen.getByRole("combobox"))
    await userEvent.click(screen.getByRole("option", { name: "Otro" }))
    await userEvent.type(screen.getByRole("textbox"), "   ")

    expect(screen.getByRole("button", { name: "Dar de baja" })).toBeDisabled()
  })
})
