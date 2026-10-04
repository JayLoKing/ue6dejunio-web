import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { renderHook, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

const updateProfile = vi.hoisted(() => vi.fn())
const refresh = vi.hoisted(() => vi.fn())
const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }))

vi.mock("../services/authService", () => ({
  AuthService: { updateProfile, refresh },
}))
vi.mock("sonner", () => ({ toast }))

import { useUpdateProfile } from "./useUpdateProfile"
import { useAuthStore } from "../store/authStore"
import type { CredentialResponse } from "../models/response/credential-response"

let qc: QueryClient

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={qc}>{children}</QueryClientProvider>
)

const renewed: CredentialResponse = {
  userId: "u-1",
  email: "nora@ue6.bo",
  fullName: "Nora Nueva",
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

const payload = { names: "Nora", lastNames: "Nueva", phone: "70000000" }

beforeEach(() => {
  vi.clearAllMocks()
  updateProfile.mockResolvedValue(undefined)
  refresh.mockResolvedValue(renewed)
  useAuthStore.getState().logout()
  qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
})

describe("useUpdateProfile", () => {
  /**
   * El nombre del encabezado sale del token, y el token que ya existe sigue diciendo el nombre
   * viejo: guardar sin renovar dejaba el cambio hecho en la base y invisible hasta volver a entrar.
   */
  it("renueva la sesión después de guardar, para que el encabezado cambie", async () => {
    const { result } = renderHook(() => useUpdateProfile(), { wrapper })

    result.current.mutate(payload)

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(updateProfile).toHaveBeenCalledWith(payload)
    expect(refresh).toHaveBeenCalledTimes(1)
    expect(useAuthStore.getState().fullName).toBe("Nora Nueva")
    expect(useAuthStore.getState().accessToken).toBe("fresh-jwt")
    expect(toast.success).toHaveBeenCalledWith("Perfil actualizado.")
  })

  it("invalida el perfil guardado para que el formulario lea lo nuevo", async () => {
    qc.setQueryData(["auth", "profile"], { names: "Viejo" })
    const { result } = renderHook(() => useUpdateProfile(), { wrapper })

    result.current.mutate(payload)

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(qc.getQueryState(["auth", "profile"])?.isInvalidated).toBe(true)
  })

  /**
   * El guardado ya ocurrió cuando falla la renovación. Reportarlo como error mentiría: el cambio
   * está hecho, sólo el encabezado queda con el nombre anterior hasta la próxima sesión.
   */
  it("sigue siendo un éxito si sólo falla la renovación, y lo dice", async () => {
    refresh.mockRejectedValue(new Error("401"))
    const { result } = renderHook(() => useUpdateProfile(), { wrapper })

    result.current.mutate(payload)

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(toast.success).toHaveBeenCalledWith(
      expect.stringContaining("Perfil actualizado")
    )
    expect(useAuthStore.getState().accessToken).toBeNull()
  })

  it("no renueva ni avisa éxito cuando el guardado falla", async () => {
    updateProfile.mockRejectedValue(new Error("400"))
    const { result } = renderHook(() => useUpdateProfile(), { wrapper })

    result.current.mutate(payload)

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(refresh).not.toHaveBeenCalled()
    expect(toast.success).not.toHaveBeenCalled()
  })
})
