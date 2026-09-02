import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { PdcReviewActions } from "./PdcReviewActions"

describe("PdcReviewActions", () => {
  // Approving and observing are the two answers the Director may give, and only to a plan that was
  // actually handed in. The API refuses the rest, so offering the buttons would promise a 409.
  it("offers both answers on a plan waiting for review", () => {
    render(
      <PdcReviewActions
        status="Published"
        deciding={false}
        onApprove={vi.fn()}
        onObserve={vi.fn()}
      />
    )

    expect(screen.getByRole("button", { name: "Aprobar" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Observar" })).toBeInTheDocument()
  })

  it("offers no answer on a plan that is not waiting for one", () => {
    render(
      <PdcReviewActions
        status="Approved"
        deciding={false}
        onApprove={vi.fn()}
        onObserve={vi.fn()}
      />
    )

    expect(
      screen.queryByRole("button", { name: "Aprobar" })
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole("button", { name: "Observar" })
    ).not.toBeInTheDocument()
    expect(screen.getByText(/no está esperando revisión/i)).toBeInTheDocument()
  })

  it("approves the plan it was given", async () => {
    const onApprove = vi.fn()
    render(
      <PdcReviewActions
        status="Under Review"
        deciding={false}
        onApprove={onApprove}
        onObserve={vi.fn()}
      />
    )

    await userEvent.click(screen.getByRole("button", { name: "Aprobar" }))

    expect(onApprove).toHaveBeenCalledOnce()
  })

  // The API refuses an observation with no text, and a Director who clicks "Observar" is saying
  // there is something to correct. The field is what they say it is.
  it("asks what to correct before it will send an observation", async () => {
    const onObserve = vi.fn()
    render(
      <PdcReviewActions
        status="Published"
        deciding={false}
        onApprove={vi.fn()}
        onObserve={onObserve}
      />
    )

    await userEvent.click(screen.getByRole("button", { name: "Observar" }))
    const send = screen.getByRole("button", { name: "Enviar observación" })

    expect(send).toBeDisabled()

    await userEvent.type(
      screen.getByPlaceholderText(/observaciones/i),
      "Falta el objetivo de la segunda materia."
    )
    expect(send).toBeEnabled()

    await userEvent.click(send)
    expect(onObserve).toHaveBeenCalledWith(
      "Falta el objetivo de la segunda materia."
    )
  })

  // Whitespace is not an observation. It would pass a length check here and be refused by the API.
  it("does not take blank space for an observation", async () => {
    render(
      <PdcReviewActions
        status="Published"
        deciding={false}
        onApprove={vi.fn()}
        onObserve={vi.fn()}
      />
    )

    await userEvent.click(screen.getByRole("button", { name: "Observar" }))
    await userEvent.type(screen.getByPlaceholderText(/observaciones/i), "   ")

    expect(
      screen.getByRole("button", { name: "Enviar observación" })
    ).toBeDisabled()
  })

  // A decision already on its way must not be sent twice: both answers move the plan out of review,
  // so the second one lands on a plan the API no longer accepts one for.
  it("takes no second answer while one is on its way", () => {
    render(
      <PdcReviewActions
        status="Published"
        deciding
        onApprove={vi.fn()}
        onObserve={vi.fn()}
      />
    )

    expect(screen.getByRole("button", { name: "Aprobar" })).toBeDisabled()
    expect(screen.getByRole("button", { name: "Observar" })).toBeDisabled()
  })
})
