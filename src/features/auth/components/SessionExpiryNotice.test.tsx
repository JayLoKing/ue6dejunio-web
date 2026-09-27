import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const navigate = vi.fn()
vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => navigate,
}))

const refreshMutate = vi.fn()
let refreshPending = false
vi.mock("../hooks/useRefreshSession", () => ({
  useRefreshSession: () => ({
    mutate: refreshMutate,
    isPending: refreshPending,
  }),
}))

import { SessionExpiryNotice } from "./SessionExpiryNotice"
import { useAuthStore } from "../store/authStore"
import type { CredentialResponse } from "../models/response/credential-response"

const session = (expiresAt: string): CredentialResponse => ({
  userId: "u-1",
  email: "nora@ue6.bo",
  fullName: "Nora Arnez",
  role: "Teacher",
  accessToken: "jwt",
  tokenType: "Bearer",
  expiresAt,
  mustChangePassword: false,
  gradeName: null,
  parallelName: null,
  courseId: null,
  technical: false,
})

/** Un momento fijo, para que "faltan dos minutos" sea un hecho y no una carrera con el reloj. */
const NOW = new Date("2026-09-27T13:00:00.000Z")

const minutesFromNow = (minutes: number): string =>
  new Date(NOW.getTime() + minutes * 60_000).toISOString()

describe("SessionExpiryNotice", () => {
  beforeEach(() => {
    // Sólo `Date`: los timers reales son los que user-event necesita para agendar sus propios
    // pasos, y fingirlos deja el click esperando para siempre.
    vi.useFakeTimers({ toFake: ["Date"] })
    vi.setSystemTime(NOW)
    refreshPending = false
    refreshMutate.mockClear()
    navigate.mockClear()
    useAuthStore.getState().logout()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("ofrece seguir trabajando cuando la sesión está por cerrarse", () => {
    useAuthStore.getState().setSession(session(minutesFromNow(2)))

    render(<SessionExpiryNotice />)

    expect(
      screen.getByRole("button", { name: /seguir trabajando/i })
    ).toBeEnabled()
  })

  it("renueva la sesión al apretarlo", async () => {
    useAuthStore.getState().setSession(session(minutesFromNow(2)))

    render(<SessionExpiryNotice />)
    await userEvent.click(
      screen.getByRole("button", { name: /seguir trabajando/i })
    )

    expect(refreshMutate).toHaveBeenCalledTimes(1)
    // Renovar no es salir: el botón de al lado sí navega, y confundirlos tiraría a la persona al
    // login justo cuando pidió quedarse.
    expect(navigate).not.toHaveBeenCalled()
  })

  it("no lo ofrece dos veces mientras la renovación está en curso", () => {
    refreshPending = true
    useAuthStore.getState().setSession(session(minutesFromNow(2)))

    render(<SessionExpiryNotice />)

    expect(screen.getByRole("button", { name: /renovando/i })).toBeDisabled()
  })

  /**
   * Con la sesión ya vencida no hay token con el que renovar, así que el botón sería una promesa
   * que la API rechaza. Ahí la única salida honesta sigue siendo volver a entrar.
   */
  it("no lo ofrece cuando la sesión ya venció", () => {
    useAuthStore.getState().setSession(session(minutesFromNow(-1)))

    render(<SessionExpiryNotice />)

    expect(
      screen.queryByRole("button", { name: /seguir trabajando/i })
    ).not.toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: /ingresar de nuevo/i })
    ).toBeInTheDocument()
  })

  it("no muestra nada con la sesión recién abierta", () => {
    useAuthStore.getState().setSession(session(minutesFromNow(15)))

    render(<SessionExpiryNotice />)

    expect(
      screen.queryByRole("button", { name: /seguir trabajando/i })
    ).not.toBeInTheDocument()
  })
})
