import { render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

import type { UsersListItem } from "../models/response/user-response"

const resend = vi.hoisted(() => vi.fn())
const activate = vi.hoisted(() => vi.fn())
const rows = vi.hoisted(() => ({ current: [] as UsersListItem[] }))

vi.mock("../hooks/useUsers", () => ({
  useUsers: () => ({
    data: {
      content: rows.current,
      page: 0,
      size: 10,
      total: rows.current.length,
      totalPages: 1,
    },
    isLoading: false,
    isFetching: false,
    refetch: vi.fn(),
  }),
}))
vi.mock("../hooks/useDeactivateUser", () => ({
  useDeactivateUser: () => ({ mutate: vi.fn(), isPending: false }),
}))
vi.mock("../hooks/useActivateUser", () => ({
  useActivateUser: () => ({ mutate: activate, isPending: false }),
}))
vi.mock("../hooks/useResendCredentials", () => ({
  useResendCredentials: () => ({ mutate: resend, isPending: false }),
}))
vi.mock("./EditUserDialog", () => ({ EditUserDialog: () => null }))

import { UsersTable } from "./UsersTable"

const user = (over: Partial<UsersListItem>): UsersListItem => ({
  id: "u-1",
  ci: "1234567",
  names: "Ana",
  lastNames: "Quispe",
  phone: null,
  email: "ana@ue6.bo",
  role: "Teacher",
  active: true,
  mustChangePassword: true,
  ...over,
})

beforeEach(() => {
  vi.clearAllMocks()
  rows.current = [user({})]
})

describe("UsersTable: Reenviar credenciales", () => {
  it("está habilitado mientras la persona no cambió su contraseña temporal", () => {
    render(<UsersTable />)

    expect(
      screen.getByRole("button", { name: /reenviar credenciales/i })
    ).toBeEnabled()
  })

  /** Reenviar a quien ya eligió su contraseña la API lo rechaza con 409; el botón ni lo ofrece. */
  it("está deshabilitado, y dice por qué, cuando ya la cambió", () => {
    rows.current = [user({ mustChangePassword: false })]
    render(<UsersTable />)

    const button = screen.getByRole("button", {
      name: /reenviar credenciales/i,
    })
    expect(button).toBeDisabled()
    expect(button).toHaveAttribute("title", "Ya cambió su contraseña temporal")
  })

  it("está deshabilitado para una cuenta dada de baja", () => {
    rows.current = [user({ active: false })]
    render(<UsersTable />)

    expect(
      screen.getByRole("button", { name: /reenviar credenciales/i })
    ).toBeDisabled()
  })

  it("pide confirmación antes de reenviar, y reenvía al confirmar", async () => {
    render(<UsersTable />)

    await userEvent.click(
      screen.getByRole("button", { name: /reenviar credenciales/i })
    )
    expect(resend).not.toHaveBeenCalled()

    const dialog = await screen.findByRole("alertdialog")
    expect(dialog).toHaveTextContent("ana@ue6.bo")
    await userEvent.click(
      within(dialog).getByRole("button", { name: /reenviar/i })
    )

    await waitFor(() =>
      expect(resend).toHaveBeenCalledWith("u-1", expect.anything())
    )
  })
})

describe("UsersTable: Habilitar y Dar de baja", () => {
  it("ofrece Dar de baja, y no Habilitar, a una cuenta activa", () => {
    render(<UsersTable />)

    expect(screen.getByRole("button", { name: /dar de baja/i })).toBeEnabled()
    expect(
      screen.queryByRole("button", { name: /habilitar/i })
    ).not.toBeInTheDocument()
  })

  it("ofrece Habilitar, y no Dar de baja, a una cuenta dada de baja", () => {
    rows.current = [user({ active: false })]
    render(<UsersTable />)

    expect(screen.getByRole("button", { name: /habilitar/i })).toBeEnabled()
    expect(
      screen.queryByRole("button", { name: /dar de baja/i })
    ).not.toBeInTheDocument()
  })

  it("pide confirmación antes de habilitar, y habilita al confirmar", async () => {
    rows.current = [user({ active: false })]
    render(<UsersTable />)

    await userEvent.click(screen.getByRole("button", { name: /habilitar/i }))
    expect(activate).not.toHaveBeenCalled()

    const dialog = await screen.findByRole("alertdialog")
    expect(dialog).toHaveTextContent("Ana Quispe")
    await userEvent.click(
      within(dialog).getByRole("button", { name: /habilitar/i })
    )

    await waitFor(() =>
      expect(activate).toHaveBeenCalledWith("u-1", expect.anything())
    )
  })
})
