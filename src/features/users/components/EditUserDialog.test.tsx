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

  /**
   * Dar de baja y reactivar tienen su propia acción en la tabla. Un campo Estado aquí era un
   * segundo camino que la API ya no acepta.
   */
  it("no ofrece cambiar el estado ni lo manda", async () => {
    render(<EditUserDialog user={user} onClose={() => {}} />)

    expect(screen.queryByLabelText("Estado")).not.toBeInTheDocument()

    await save()

    expect(sentPayload()).not.toHaveProperty("active")
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

describe("EditUserDialog — CI", () => {
  beforeEach(() => mutateAsync.mockClear())

  it("muestra el CI actual en un campo editable", () => {
    render(<EditUserDialog user={user} onClose={() => {}} />)

    expect(screen.getByLabelText("CI")).toHaveValue("1234567")
  })

  it("manda el CI corregido", async () => {
    render(<EditUserDialog user={user} onClose={() => {}} />)

    await userEvent.clear(screen.getByLabelText("CI"))
    await userEvent.type(screen.getByLabelText("CI"), "7654321")
    await save()

    expect(sentPayload()).toEqual(expect.objectContaining({ ci: "7654321" }))
  })

  /** Igual que el correo: lo que no cambió no viaja, y la API no tiene nada que comprobar. */
  it("no manda el CI cuando no cambió", async () => {
    render(<EditUserDialog user={user} onClose={() => {}} />)

    await save()

    expect(sentPayload()).not.toHaveProperty("ci")
  })

  it("rechaza un CI demasiado corto sin llamar a la API", async () => {
    render(<EditUserDialog user={user} onClose={() => {}} />)

    await userEvent.clear(screen.getByLabelText("CI"))
    await userEvent.type(screen.getByLabelText("CI"), "123")
    await save()

    expect(
      await screen.findByText("CI: mínimo 5 caracteres")
    ).toBeInTheDocument()
    expect(mutateAsync).not.toHaveBeenCalled()
  })

  /**
   * Un CI, correo o teléfono que ya tiene otra persona vuelve como 409, y el interceptor muestra
   * el mensaje de la API. El diálogo tiene que quedar abierto con lo escrito, para corregir ese
   * dato y no volver a cargar todo.
   */
  it("queda abierto cuando la API rechaza un dato duplicado", async () => {
    const onClose = vi.fn()
    mutateAsync.mockRejectedValueOnce(new Error("409"))
    render(<EditUserDialog user={user} onClose={onClose} />)

    await userEvent.clear(screen.getByLabelText("CI"))
    await userEvent.type(screen.getByLabelText("CI"), "7654321")
    await save()

    expect(mutateAsync).toHaveBeenCalled()
    expect(onClose).not.toHaveBeenCalled()
    expect(screen.getByLabelText("CI")).toHaveValue("7654321")
  })
})
