import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { renderHook, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

const changeEmail = vi.hoisted(() => vi.fn())
const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }))

vi.mock("../services/authService", () => ({
  AuthService: { changeEmail },
}))
vi.mock("sonner", () => ({ toast }))

import { useChangeEmail } from "./useChangeEmail"
import { useAuthStore } from "../store/authStore"
import type { CredentialResponse } from "../models/response/credential-response"

let qc: QueryClient

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={qc}>{children}</QueryClientProvider>
)

const renewed: CredentialResponse = {
  userId: "u-1",
  email: "nora.nueva@ue6.bo",
  fullName: "Nora Arnez",
  role: "Teacher",
  accessToken: "fresh-jwt",
  tokenType: "Bearer",
  expiresAt: "2026-10-03T13:15:00.000Z",
  mustChangePassword: false,
  gradeName: null,
  parallelName: null,
  courseId: null,
  technical: false,
}

const payload = { newEmail: "nora.nueva@ue6.bo", currentPassword: "secreta1" }

beforeEach(() => {
  vi.clearAllMocks()
  useAuthStore.setState({ email: "nora@ue6.bo", accessToken: "old-jwt" })
  qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
})

describe("useChangeEmail", () => {
  /**
   * El token lleva el correo, así que la API contesta con una sesión nueva. Guardarla deja al
   * encabezado y a la próxima renovación leyendo la dirección nueva, sin volver a entrar.
   */
  it("manda el pedido y guarda la sesión nueva que trae el correo nuevo", async () => {
    changeEmail.mockResolvedValue(renewed)
    const { result } = renderHook(() => useChangeEmail(), { wrapper })

    result.current.mutate(payload)

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(changeEmail).toHaveBeenCalledWith(payload)
    expect(useAuthStore.getState().email).toBe("nora.nueva@ue6.bo")
    expect(useAuthStore.getState().accessToken).toBe("fresh-jwt")
    expect(toast.success).toHaveBeenCalledWith("Correo actualizado.")
  })

  it("relee el perfil para que el diálogo muestre la dirección nueva", async () => {
    changeEmail.mockResolvedValue(renewed)
    qc.setQueryData(["auth", "profile"], { email: "nora@ue6.bo" })
    const { result } = renderHook(() => useChangeEmail(), { wrapper })

    result.current.mutate(payload)

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(qc.getQueryState(["auth", "profile"])?.isInvalidated).toBe(true)
  })

  /** El interceptor ya muestra el mensaje de la API: acá no se agrega otro aviso. */
  it("no toca la sesión ni avisa éxito cuando la API lo rechaza", async () => {
    changeEmail.mockRejectedValue(new Error("400"))
    const { result } = renderHook(() => useChangeEmail(), { wrapper })

    result.current.mutate(payload)

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(useAuthStore.getState().email).toBe("nora@ue6.bo")
    expect(toast.success).not.toHaveBeenCalled()
    expect(toast.error).not.toHaveBeenCalled()
  })
})
