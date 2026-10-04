import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { createRef } from "react"
import { useForm } from "react-hook-form"
import { describe, expect, it, vi } from "vitest"

import { PasswordInput } from "./PasswordInput"

function getInput(): HTMLInputElement {
  return screen.getByLabelText("Contraseña", {
    selector: "input",
  }) as HTMLInputElement
}

describe("PasswordInput", () => {
  it("starts hidden, with a button that offers to show it", () => {
    render(<PasswordInput aria-label="Contraseña" />)

    expect(getInput().type).toBe("password")
    const toggle = screen.getByRole("button", { name: "Mostrar contraseña" })
    expect(toggle).toHaveAttribute("aria-pressed", "false")
    expect(toggle).toHaveAttribute("type", "button")
  })

  it("shows the text on click and flips the label and pressed state", async () => {
    const user = userEvent.setup()
    render(<PasswordInput aria-label="Contraseña" defaultValue="secreto" />)

    await user.click(screen.getByRole("button", { name: "Mostrar contraseña" }))

    expect(getInput().type).toBe("text")
    expect(getInput().value).toBe("secreto")
    const toggle = screen.getByRole("button", { name: "Ocultar contraseña" })
    expect(toggle).toHaveAttribute("aria-pressed", "true")

    await user.click(toggle)
    expect(getInput().type).toBe("password")
  })

  it("never submits a surrounding form", async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn((e: React.FormEvent) => e.preventDefault())
    render(
      <form onSubmit={onSubmit}>
        <PasswordInput aria-label="Contraseña" />
      </form>
    )

    await user.click(screen.getByRole("button", { name: "Mostrar contraseña" }))

    expect(onSubmit).not.toHaveBeenCalled()
  })

  it("disables the toggle with the input", () => {
    render(<PasswordInput aria-label="Contraseña" disabled />)

    expect(
      screen.getByRole("button", { name: "Mostrar contraseña" })
    ).toBeDisabled()
  })

  it("forwards ref, name, onChange and aria-invalid to the input", async () => {
    const user = userEvent.setup()
    const ref = createRef<HTMLInputElement>()
    const onChange = vi.fn()
    render(
      <PasswordInput
        ref={ref}
        name="password"
        aria-label="Contraseña"
        aria-invalid
        autoComplete="new-password"
        onChange={onChange}
      />
    )

    await user.type(getInput(), "a")

    expect(ref.current).toBe(getInput())
    expect(getInput()).toHaveAttribute("name", "password")
    expect(getInput()).toHaveAttribute("aria-invalid", "true")
    expect(getInput()).toHaveAttribute("autocomplete", "new-password")
    expect(onChange).toHaveBeenCalled()
  })

  it("keeps what was typed when toggled", async () => {
    const user = userEvent.setup()
    render(<PasswordInput aria-label="Contraseña" />)

    await user.type(getInput(), "abc")
    await user.click(screen.getByRole("button", { name: "Mostrar contraseña" }))

    expect(getInput().value).toBe("abc")
  })

  it("works with react-hook-form register", async () => {
    const user = userEvent.setup()
    const onValid = vi.fn()
    function Harness() {
      const { register, handleSubmit } = useForm<{ password: string }>({
        defaultValues: { password: "" },
      })
      return (
        <form onSubmit={handleSubmit(onValid)}>
          <PasswordInput aria-label="Contraseña" {...register("password")} />
          <button type="submit">Enviar</button>
        </form>
      )
    }
    render(<Harness />)

    await user.type(getInput(), "hunter2")
    await user.click(screen.getByRole("button", { name: "Mostrar contraseña" }))
    await user.click(screen.getByRole("button", { name: "Enviar" }))

    expect(onValid).toHaveBeenCalledTimes(1)
    expect(onValid.mock.calls[0][0]).toEqual({ password: "hunter2" })
  })
})
