import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { ComposeNotification } from "./ComposeNotification"
import { HEADING } from "../utils/heading"

const props = (
  over: Partial<Parameters<typeof ComposeNotification>[0]> = {}
) => ({
  recipients: [
    { id: "u-1", fullName: "Ana Pérez" },
    { id: "u-2", fullName: "Luis Rojas" },
  ],
  sending: false,
  onSend: vi.fn(),
  ...over,
})

async function pick(label: RegExp, option: string) {
  await userEvent.click(screen.getByRole("combobox", { name: label }))
  await userEvent.click(screen.getByRole("option", { name: option }))
}

describe("ComposeNotification", () => {
  it("sends the recipient, the reason and the message", async () => {
    const p = props()
    render(<ComposeNotification {...p} />)

    await pick(/destinatario/i, "Ana Pérez")
    await pick(/motivo/i, "Citación a dirección")
    await userEvent.type(
      screen.getByLabelText(/mensaje/i),
      "Aproxímese a dirección."
    )
    await userEvent.click(screen.getByRole("button", { name: /enviar/i }))

    expect(p.onSend).toHaveBeenCalledWith({
      receiver_id: "u-1",
      type: "SUMMONS",
      message: "Aproxímese a dirección.",
    })
  })

  // The API refuses a catalog type carrying a subject of its own, so the box only appears for the
  // one reason that needs it. Showing it always would invite a 400 the teacher cannot explain.
  it("asks for a subject only when the reason is not in the list", async () => {
    render(<ComposeNotification {...props()} />)

    await pick(/motivo/i, "Citación a dirección")
    expect(screen.queryByLabelText(/^asunto$/i)).not.toBeInTheDocument()

    await pick(/motivo/i, "Otro")
    expect(screen.getByLabelText(/^asunto$/i)).toBeInTheDocument()
  })

  it("carries the typed subject on a custom one", async () => {
    const p = props()
    render(<ComposeNotification {...p} />)

    await pick(/destinatario/i, "Ana Pérez")
    await pick(/motivo/i, "Otro")
    await userEvent.type(
      screen.getByLabelText(/^asunto$/i),
      "Reunión de padres"
    )
    await userEvent.type(
      screen.getByLabelText(/mensaje/i),
      "El martes a las 9."
    )
    await userEvent.click(screen.getByRole("button", { name: /enviar/i }))

    expect(p.onSend).toHaveBeenCalledWith({
      receiver_id: "u-1",
      type: "CUSTOM",
      subject: "Reunión de padres",
      message: "El martes a las 9.",
    })
  })

  // Three ways to send something the API will refuse. Better to keep the button quiet than to
  // hand back a 400 for a form the sender can see is incomplete.
  it("does not send without a recipient", async () => {
    const p = props()
    render(<ComposeNotification {...p} />)

    await pick(/motivo/i, "Citación a dirección")
    await userEvent.type(screen.getByLabelText(/mensaje/i), "Hola")
    await userEvent.click(screen.getByRole("button", { name: /enviar/i }))

    expect(p.onSend).not.toHaveBeenCalled()
  })

  it("does not send without a message", async () => {
    const p = props()
    render(<ComposeNotification {...p} />)

    await pick(/destinatario/i, "Ana Pérez")
    await pick(/motivo/i, "Citación a dirección")
    await userEvent.click(screen.getByRole("button", { name: /enviar/i }))

    expect(p.onSend).not.toHaveBeenCalled()
  })

  it("does not send a custom one whose subject was left empty", async () => {
    const p = props()
    render(<ComposeNotification {...p} />)

    await pick(/destinatario/i, "Ana Pérez")
    await pick(/motivo/i, "Otro")
    await userEvent.type(screen.getByLabelText(/mensaje/i), "Hola")
    await userEvent.click(screen.getByRole("button", { name: /enviar/i }))

    expect(p.onSend).not.toHaveBeenCalled()
  })

  // The Director writes to the people who answer to him, and the API says so too. A name the
  // server would refuse has no business being offered.
  it("offers the teachers and the secretary", async () => {
    render(<ComposeNotification {...props()} />)

    await userEvent.click(
      screen.getByRole("combobox", { name: /destinatario/i })
    )

    expect(
      screen.getByRole("option", { name: "Ana Pérez" })
    ).toBeInTheDocument()
    expect(
      screen.getByRole("option", { name: "Luis Rojas" })
    ).toBeInTheDocument()
  })

  // The words the Director picks from are the words the receiver will read at the top of the
  // row. Spelled in two places they drift, and then a notice sent as "Cuaderno pedagógico"
  // arrives headed as something else.
  it("offers each reason by the same words the inbox heads it with", async () => {
    render(<ComposeNotification {...props()} />)

    await userEvent.click(screen.getByRole("combobox", { name: /motivo/i }))

    for (const type of [
      "SUMMONS",
      "NOTEBOOK",
      "ATTENDANCE",
      "PDC_PROGRESS",
    ] as const) {
      expect(
        screen.getByRole("option", { name: HEADING[type] })
      ).toBeInTheDocument()
    }
  })

  it("says so when there is nobody to write to", () => {
    render(<ComposeNotification {...props({ recipients: [] })} />)

    expect(
      screen.getByText(/no hay docentes ni secretaria/i)
    ).toBeInTheDocument()
  })
})
