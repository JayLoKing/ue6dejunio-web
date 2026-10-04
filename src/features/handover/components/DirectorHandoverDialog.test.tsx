import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

import type { UserLookup } from "../models/response/handover-response"
import { useAuthStore } from "@/features/auth/store/authStore"

const lookup = vi.hoisted(() => vi.fn())
const start = vi.hoisted(() => vi.fn())

vi.mock("../hooks/useLookupUser", () => ({
  useLookupUser: () => ({ mutateAsync: lookup, isPending: false }),
}))
vi.mock("../hooks/useStartHandover", () => ({
  useStartHandover: () => ({ mutateAsync: start, isPending: false }),
}))

import { DirectorHandoverDialog } from "./DirectorHandoverDialog"

const teacher: UserLookup = {
  id: "u-1",
  fullName: "Ana Quispe",
  email: "ana@ue6.bo",
  role: "Teacher",
  active: true,
}

const renderDialog = (onOpenChange = vi.fn()) =>
  render(<DirectorHandoverDialog open onOpenChange={onOpenChange} />)

const searchEmail = async (email: string) => {
  await userEvent.type(
    screen.getByLabelText(/correo del nuevo director/i),
    email
  )
  await userEvent.click(screen.getByRole("button", { name: /buscar/i }))
}

beforeEach(() => {
  vi.clearAllMocks()
  useAuthStore.setState({ email: "dir@ue6.bo", role: "DIRECTOR", userId: "d" })
  lookup.mockResolvedValue(null)
  start.mockResolvedValue(undefined)
})

describe("DirectorHandoverDialog", () => {
  it("avisa desde el principio que el Director actual pierde el acceso", () => {
    renderDialog()

    expect(screen.getByText(/perderás el acceso/i)).toBeInTheDocument()
  })

  it("busca el correo antes de pedir nada más", () => {
    renderDialog()

    expect(screen.queryByLabelText("CI")).not.toBeInTheDocument()
    expect(
      screen.queryByLabelText(/escribe transferir/i)
    ).not.toBeInTheDocument()
  })

  describe("correo sin cuenta", () => {
    it("revela CI, nombres, apellidos y teléfono", async () => {
      renderDialog()
      await searchEmail("nuevo@ue6.bo")

      expect(await screen.findByLabelText("CI")).toBeInTheDocument()
      expect(screen.getByLabelText("Nombres")).toBeInTheDocument()
      expect(screen.getByLabelText("Apellidos")).toBeInTheDocument()
      expect(screen.getByLabelText("Teléfono")).toBeInTheDocument()
      expect(lookup).toHaveBeenCalledWith("nuevo@ue6.bo")
    })

    it("valida los datos como el alta de usuario antes de seguir", async () => {
      renderDialog()
      await searchEmail("nuevo@ue6.bo")
      await userEvent.type(await screen.findByLabelText("CI"), "12")
      await userEvent.click(screen.getByRole("button", { name: /continuar/i }))

      expect(await screen.findByText(/CI: mínimo 5/i)).toBeInTheDocument()
      expect(screen.queryByLabelText(/escribe transferir/i)).toBeNull()
    })

    it("manda todos los datos al confirmar, y sólo entonces", async () => {
      renderDialog()
      await searchEmail("nuevo@ue6.bo")
      await userEvent.type(await screen.findByLabelText("CI"), "1234567")
      await userEvent.type(screen.getByLabelText("Nombres"), "Luis")
      await userEvent.type(screen.getByLabelText("Apellidos"), "Nuevo")
      await userEvent.type(screen.getByLabelText("Teléfono"), "70000000")
      await userEvent.click(screen.getByRole("button", { name: /continuar/i }))

      await userEvent.type(
        await screen.findByLabelText(/escribe transferir/i),
        "TRANSFERIR"
      )
      expect(start).not.toHaveBeenCalled()
      await userEvent.click(
        screen.getByRole("button", { name: /transferir la dirección/i })
      )

      await waitFor(() =>
        expect(start).toHaveBeenCalledWith({
          email: "nuevo@ue6.bo",
          ci: "1234567",
          names: "Luis",
          lastNames: "Nuevo",
          phone: "70000000",
        })
      )
    })
  })

  describe("correo de alguien que ya existe", () => {
    beforeEach(() => lookup.mockResolvedValue(teacher))

    it("muestra quién es y pide confirmar el ascenso, sin pedir sus datos", async () => {
      renderDialog()
      await searchEmail("ana@ue6.bo")

      expect(await screen.findByText("Ana Quispe")).toBeInTheDocument()
      expect(screen.getByText("Docente")).toBeInTheDocument()
      expect(screen.getByText(/pasará a ser Director/i)).toBeInTheDocument()
      expect(screen.queryByLabelText("CI")).not.toBeInTheDocument()
    })

    it("manda sólo el correo", async () => {
      renderDialog()
      await searchEmail("ana@ue6.bo")
      await userEvent.click(
        await screen.findByRole("button", { name: /continuar/i })
      )
      await userEvent.type(
        await screen.findByLabelText(/escribe transferir/i),
        "TRANSFERIR"
      )
      await userEvent.click(
        screen.getByRole("button", { name: /transferir la dirección/i })
      )

      await waitFor(() =>
        expect(start).toHaveBeenCalledWith({ email: "ana@ue6.bo" })
      )
    })
  })

  describe("confirmación escrita", () => {
    const reachConfirmation = async () => {
      lookup.mockResolvedValue(teacher)
      renderDialog()
      await searchEmail("ana@ue6.bo")
      await userEvent.click(
        await screen.findByRole("button", { name: /continuar/i })
      )
      return screen.findByLabelText(/escribe transferir/i)
    }

    it("el botón queda apagado hasta escribir la palabra exacta", async () => {
      const input = await reachConfirmation()
      const button = screen.getByRole("button", {
        name: /transferir la dirección/i,
      })
      expect(button).toBeDisabled()

      await userEvent.type(input, "transferir")
      expect(button).toBeDisabled() // minúsculas: no es la palabra

      await userEvent.clear(input)
      await userEvent.type(input, "TRANSFERIR")
      expect(button).toBeEnabled()
    })

    it("repite la advertencia en el último paso", async () => {
      await reachConfirmation()

      expect(screen.getAllByText(/perderás el acceso/i).length).toBeGreaterThan(
        0
      )
    })
  })

  describe("correos que no se pueden nombrar", () => {
    it("rechaza al que ya es Director", async () => {
      lookup.mockResolvedValue({ ...teacher, role: "Director" })
      renderDialog()
      await searchEmail("otro@ue6.bo")

      expect(
        await screen.findByText("Esa cuenta ya es Director.")
      ).toBeVisible()
      expect(
        screen.queryByRole("button", { name: /continuar/i })
      ).not.toBeInTheDocument()
    })

    it("rechaza el propio correo", async () => {
      lookup.mockResolvedValue({
        ...teacher,
        email: "dir@ue6.bo",
        role: "Director",
      })
      renderDialog()
      await searchEmail("dir@ue6.bo")

      expect(await screen.findByText(/tu propio correo/i)).toBeVisible()
    })

    it("rechaza una cuenta dada de baja", async () => {
      lookup.mockResolvedValue({ ...teacher, active: false })
      renderDialog()
      await searchEmail("ana@ue6.bo")

      expect(await screen.findByText(/dada de baja/i)).toBeVisible()
    })
  })
})
