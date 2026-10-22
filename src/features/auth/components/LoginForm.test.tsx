import type { ReactNode } from "react"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { LoginForm } from "./LoginForm"

vi.mock("@tanstack/react-router", () => ({
  Link: ({ children }: { children: ReactNode }) => <a href="#">{children}</a>,
}))

vi.mock("../hooks/useLogin", () => ({
  useLogin: () => ({ mutateAsync: vi.fn(), isPending: false }),
}))

describe("LoginForm validation timing", () => {
  it("reports an invalid email as soon as the field is left", async () => {
    render(<LoginForm />)

    await userEvent.type(screen.getByLabelText("Correo"), "not-an-email")
    expect(screen.queryByText("Correo inválido")).not.toBeInTheDocument()

    await userEvent.tab()

    expect(await screen.findByText("Correo inválido")).toBeInTheDocument()
  })
})
