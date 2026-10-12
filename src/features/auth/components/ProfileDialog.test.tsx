import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

const getProfile = vi.hoisted(() => vi.fn())
const me = vi.hoisted(() => vi.fn())
const mutateAsync = vi.hoisted(() => vi.fn())
const changeEmailAsync = vi.hoisted(() => vi.fn())

vi.mock("../services/authService", () => ({
  AuthService: { getProfile, me },
}))
vi.mock("../hooks/useUpdateProfile", () => ({
  useUpdateProfile: () => ({ mutateAsync, isPending: false }),
}))
vi.mock("../hooks/useChangeEmail", () => ({
  useChangeEmail: () => ({ mutateAsync: changeEmailAsync, isPending: false }),
}))

import { ProfileDialog } from "./ProfileDialog"

const profile = {
  ci: "1234567",
  names: "Nora",
  lastNames: "Arnez",
  phone: "70000000",
  email: "nora@ue6.bo",
}

const renderDialog = (onOpenChange = vi.fn()) =>
  render(
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      <ProfileDialog open onOpenChange={onOpenChange} />
    </QueryClientProvider>
  )

beforeEach(() => {
  vi.clearAllMocks()
  getProfile.mockResolvedValue(profile)
  me.mockResolvedValue({ role: "Teacher", email: profile.email })
  mutateAsync.mockResolvedValue(undefined)
  changeEmailAsync.mockResolvedValue(undefined)
})

describe("ProfileDialog", () => {
  it("muestra CI y correo como lectura, y nombres, apellidos y teléfono editables", async () => {
    renderDialog()

    const names = await screen.findByLabelText("Nombres")
    expect(names).toHaveValue("Nora")
    expect(screen.getByLabelText("Apellidos")).toHaveValue("Arnez")
    expect(screen.getByLabelText("Teléfono")).toHaveValue("70000000")
    expect(screen.getByLabelText("CI")).toHaveAttribute("readonly")
    expect(screen.getByLabelText("CI")).toHaveValue("1234567")
    expect(screen.getByLabelText("Correo")).toHaveAttribute("readonly")
    expect(screen.getByLabelText("Correo")).toHaveValue("nora@ue6.bo")
  })

  it("manda sólo nombres, apellidos y teléfono, ya limpios", async () => {
    renderDialog()
    const names = await screen.findByLabelText("Nombres")

    await userEvent.clear(names)
    await userEvent.type(names, "  María   José ")
    await userEvent.click(screen.getByRole("button", { name: /guardar/i }))

    await waitFor(() =>
      expect(mutateAsync).toHaveBeenCalledWith({
        names: "María José",
        lastNames: "Arnez",
        phone: "70000000",
      })
    )
  })

  it("no manda nada si los nombres quedan vacíos", async () => {
    renderDialog()
    const names = await screen.findByLabelText("Nombres")

    await userEvent.clear(names)
    await userEvent.click(screen.getByRole("button", { name: /guardar/i }))

    expect(await screen.findByText(/nombres es requerido/i)).toBeInTheDocument()
    expect(mutateAsync).not.toHaveBeenCalled()
  })

  it("avisa en vez de quedar vacío cuando el perfil no carga", async () => {
    getProfile.mockRejectedValue(new Error("500"))
    renderDialog()

    expect(
      await screen.findByText(/no se pudo cargar el perfil/i)
    ).toBeInTheDocument()
  })

  it("cierra el diálogo cuando el guardado sale bien", async () => {
    const onOpenChange = vi.fn()
    renderDialog(onOpenChange)
    await screen.findByLabelText("Nombres")

    await userEvent.click(screen.getByRole("button", { name: /guardar/i }))

    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false))
  })

  describe("cambiar correo", () => {
    const openEmailForm = async () => {
      renderDialog()
      await screen.findByLabelText("Nombres")
      await userEvent.click(
        screen.getByRole("button", { name: /cambiar correo/i })
      )
    }

    it("pide el correo nuevo y la contraseña actual", async () => {
      await openEmailForm()

      expect(screen.getByLabelText("Correo nuevo")).toHaveValue("")
      expect(screen.getByLabelText("Contraseña actual")).toHaveAttribute(
        "type",
        "password"
      )
    })

    it("manda el correo nuevo ya limpio junto con la contraseña", async () => {
      await openEmailForm()

      await userEvent.type(
        screen.getByLabelText("Correo nuevo"),
        "  Nora.Nueva@UE6.bo "
      )
      await userEvent.type(
        screen.getByLabelText("Contraseña actual"),
        "secreta1"
      )
      await userEvent.click(
        screen.getByRole("button", { name: /guardar correo/i })
      )

      await waitFor(() =>
        expect(changeEmailAsync).toHaveBeenCalledWith({
          newEmail: "nora.nueva@ue6.bo",
          currentPassword: "secreta1",
        })
      )
    })

    it("no manda nada con un correo inválido o sin contraseña", async () => {
      await openEmailForm()

      await userEvent.type(
        screen.getByLabelText("Correo nuevo"),
        "no-es-correo"
      )
      await userEvent.click(
        screen.getByRole("button", { name: /guardar correo/i })
      )

      expect(await screen.findByText("Correo inválido")).toBeInTheDocument()
      expect(
        screen.getByText(/contraseña actual requerida/i)
      ).toBeInTheDocument()
      expect(changeEmailAsync).not.toHaveBeenCalled()
    })

    it("vuelve al perfil después de cambiarlo", async () => {
      await openEmailForm()

      await userEvent.type(
        screen.getByLabelText("Correo nuevo"),
        "nora.nueva@ue6.bo"
      )
      await userEvent.type(
        screen.getByLabelText("Contraseña actual"),
        "secreta1"
      )
      await userEvent.click(
        screen.getByRole("button", { name: /guardar correo/i })
      )

      expect(await screen.findByLabelText("Nombres")).toBeInTheDocument()
      expect(screen.queryByLabelText("Correo nuevo")).not.toBeInTheDocument()
    })

    it("se queda en el formulario si la API lo rechaza", async () => {
      changeEmailAsync.mockRejectedValue(new Error("400"))
      await openEmailForm()

      await userEvent.type(
        screen.getByLabelText("Correo nuevo"),
        "nora.nueva@ue6.bo"
      )
      await userEvent.type(screen.getByLabelText("Contraseña actual"), "mala")
      await userEvent.click(
        screen.getByRole("button", { name: /guardar correo/i })
      )

      await waitFor(() => expect(changeEmailAsync).toHaveBeenCalled())
      expect(screen.getByLabelText("Correo nuevo")).toBeInTheDocument()
    })
  })
})
