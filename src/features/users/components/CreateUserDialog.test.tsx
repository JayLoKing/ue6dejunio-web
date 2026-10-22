import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { CreateUserDialog } from "./CreateUserDialog"

const mutateAsync = vi
  .fn()
  .mockResolvedValue({ names: "Ana", lastNames: "Quispe" })

// The mutation is stubbed so these tests are about the rule the form enforces, not about
// react-query: what reaches the API is asserted through the payload it was handed.
vi.mock("../hooks/useCreateUser", () => ({
  useCreateUser: () => ({ mutateAsync, isPending: false }),
}))

const TECHNICAL_LABEL = /docente técnico/i

const openDialog = async () => {
  render(<CreateUserDialog />)
  await userEvent.click(screen.getByRole("button", { name: /nuevo usuario/i }))
}

const chooseRole = async (label: string) => {
  await userEvent.click(screen.getByRole("combobox"))
  await userEvent.click(screen.getByRole("option", { name: label }))
}

const fillIdentity = async () => {
  await userEvent.type(screen.getByLabelText("CI"), "1234567")
  await userEvent.type(screen.getByLabelText("Nombres"), "Ana")
  await userEvent.type(screen.getByLabelText("Apellidos"), "Quispe")
  await userEvent.type(screen.getByLabelText("Correo"), "ana@ue6.bo")
}

describe("CreateUserDialog", () => {
  beforeEach(() => mutateAsync.mockClear())

  /** Nothing has been chosen yet, so there is no role for the question to be about. */
  it("does not ask about technical subjects before a role is picked", async () => {
    await openDialog()

    expect(screen.queryByLabelText(TECHNICAL_LABEL)).not.toBeInTheDocument()
  })

  it("asks whether a teacher takes technical subjects", async () => {
    await openDialog()
    await chooseRole("Docente")

    expect(screen.getByLabelText(TECHNICAL_LABEL)).toBeInTheDocument()
  })

  /** A Secretary teaches nothing, so the question would have no answer worth storing. */
  it("does not ask a secretary about technical subjects", async () => {
    await openDialog()
    await chooseRole("Secretario")

    expect(screen.queryByLabelText(TECHNICAL_LABEL)).not.toBeInTheDocument()
  })

  it("registers a technical teacher as technical", async () => {
    await openDialog()
    await chooseRole("Docente")
    await fillIdentity()
    await userEvent.click(screen.getByLabelText(TECHNICAL_LABEL))
    await userEvent.click(
      screen.getByRole("button", { name: /crear usuario/i })
    )

    expect(mutateAsync).toHaveBeenCalledWith(
      expect.objectContaining({ roleId: 3, technical: true })
    )
  })

  it("registers a classroom teacher as not technical", async () => {
    await openDialog()
    await chooseRole("Docente")
    await fillIdentity()
    await userEvent.click(
      screen.getByRole("button", { name: /crear usuario/i })
    )

    expect(mutateAsync).toHaveBeenCalledWith(
      expect.objectContaining({ roleId: 3, technical: false })
    )
  })

  /**
   * The answer belonged to the role it was given for. Leaving it set behind a hidden field is
   * what put a Secretary in the technical-teacher catalogue.
   */
  it("forgets the answer when the role stops being a teaching one", async () => {
    await openDialog()
    await chooseRole("Docente")
    await userEvent.click(screen.getByLabelText(TECHNICAL_LABEL))
    await chooseRole("Secretario")
    await fillIdentity()
    await userEvent.click(
      screen.getByRole("button", { name: /crear usuario/i })
    )

    expect(mutateAsync).toHaveBeenCalledWith(
      expect.objectContaining({ roleId: 2, technical: false })
    )
  })

  /**
   * A CI, email or phone someone else already has comes back as a 409, and the interceptor shows
   * the API's sentence naming it. The form has to stay open with what was typed, so the Director
   * fixes that one field instead of filling the whole form again.
   */
  it("stays open with what was typed when the API refuses a duplicate", async () => {
    mutateAsync.mockRejectedValueOnce(new Error("409"))
    await openDialog()
    await chooseRole("Docente")
    await fillIdentity()
    await userEvent.click(
      screen.getByRole("button", { name: /crear usuario/i })
    )

    expect(mutateAsync).toHaveBeenCalled()
    expect(screen.getByLabelText("CI")).toHaveValue("1234567")
    expect(screen.getByLabelText("Correo")).toHaveValue("ana@ue6.bo")
  })
})

describe("CreateUserDialog validation timing", () => {
  it("reports an invalid email as soon as the field is left", async () => {
    await openDialog()

    await userEvent.type(screen.getByLabelText("Correo"), "ana@")
    expect(screen.queryByText("Correo inválido")).not.toBeInTheDocument()

    await userEvent.tab()

    expect(await screen.findByText("Correo inválido")).toBeInTheDocument()
  })
})
