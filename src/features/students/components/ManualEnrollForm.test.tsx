import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { ManualEnrollForm } from "./ManualEnrollForm"

vi.mock("../hooks/useEnroll", () => ({
  useEnrollSingle: () => ({ mutateAsync: vi.fn(), isPending: false }),
}))

describe("ManualEnrollForm validation timing", () => {
  it("reports a required field left empty as soon as it is left", async () => {
    render(<ManualEnrollForm courseId="1" onSuccess={vi.fn()} />)

    await userEvent.click(screen.getByLabelText("Código RUDE"))
    expect(screen.queryByText("RUDE requerido")).not.toBeInTheDocument()

    await userEvent.tab()

    expect(await screen.findByText("RUDE requerido")).toBeInTheDocument()
  })
})
