import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { EditUserDialog } from "./EditUserDialog"
import type { UsersListItem } from "../models/response/user-response"

const mutateAsync = vi.fn().mockResolvedValue({})

// The mutation is stubbed so these tests are about what the form sends, not about react-query.
vi.mock("../hooks/useUpdateUser", () => ({
  useUpdateUser: () => ({ mutateAsync, isPending: false }),
}))

const user: UsersListItem = {
  id: "u-1",
  ci: "1234567",
  names: "Ana",
  lastNames: "Quispe",
  phone: "70000000",
  email: "ana@ue6.bo",
  role: "TEACHER",
  active: true,
  mustChangePassword: true,
}

const save = () =>
  userEvent.click(screen.getByRole("button", { name: /guardar cambios/i }))

const sentPayload = () => mutateAsync.mock.calls[0][0].payload

describe("EditUserDialog", () => {
  beforeEach(() => mutateAsync.mockClear())

  it("muestra el correo actual en un campo editable", () => {
    render(<EditUserDialog user={user} onClose={() => {}} />)

    expect(screen.getByLabelText("Correo")).toHaveValue("ana@ue6.bo")
  })

  it("manda el correo corregido", async () => {
    render(<EditUserDialog user={user} onClose={() => {}} />)

    await userEvent.clear(screen.getByLabelText("Correo"))
    await userEvent.type(screen.getByLabelText("Correo"), "ana.quispe@ue6.bo")
    await save()

    expect(sentPayload()).toEqual(
      expect.objectContaining({ email: "ana.quispe@ue6.bo" })
    )
  })

  /**
   * Mandarlo sin cambios no rompe nada en la API, pero un correo guardado con mayúsculas volvería
   * normalizado y contaría como cambio: a quien nunca entró le saldría una contraseña nueva.
   */
  it("no manda el correo cuando no cambió", async () => {
    render(
      <EditUserDialog
        user={{ ...user, email: "Ana@UE6.bo" }}
        onClose={() => {}}
      />
    )

    await save()

    expect(sentPayload()).not.toHaveProperty("email")
  })

  it("rechaza un correo inválido sin llamar a la API", async () => {
    render(<EditUserDialog user={user} onClose={() => {}} />)

    await userEvent.clear(screen.getByLabelText("Correo"))
    await userEvent.type(screen.getByLabelText("Correo"), "no-es-un-correo")
    await save()

    expect(await screen.findByText("Correo inválido")).toBeInTheDocument()
    expect(mutateAsync).not.toHaveBeenCalled()
  })
})
