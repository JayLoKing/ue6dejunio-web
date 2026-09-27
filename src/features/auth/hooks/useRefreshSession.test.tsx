import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { renderHook, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

const refresh = vi.hoisted(() => vi.fn())

vi.mock("../services/authService", () => ({
  AuthService: { refresh },
}))

import { useRefreshSession } from "./useRefreshSession"
import { useAuthStore } from "../store/authStore"
import type { CredentialResponse } from "../models/response/credential-response"

let qc: QueryClient

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={qc}>{children}</QueryClientProvider>
)

/** Lo que responde la API al renovar: un token nuevo Y los claims recalculados. */
const renewed: CredentialResponse = {
  userId: "u-1",
  email: "nora@ue6.bo",
  fullName: "Nora Arnez",
  role: "Teacher",
  accessToken: "fresh-jwt",
  tokenType: "Bearer",
  expiresAt: "2026-09-27T13:15:00.000Z",
  mustChangePassword: false,
  gradeName: "Segundo",
  parallelName: "B",
  courseId: "course-2",
  technical: false,
}

beforeEach(() => {
  vi.clearAllMocks()
  refresh.mockResolvedValue(renewed)
  useAuthStore.getState().logout()
  qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
})

describe("useRefreshSession", () => {
  /**
   * Guarda la respuesta ENTERA, no sólo el token, y esto es lo que lo fija.
   *
   * El token nuevo trae claims recalculados por el backend: el curso de aula entre ellos, que un
   * intercambio de docentes le cambia a dos personas. Quedarse sólo con `accessToken` dejaría al
   * cuaderno leyendo el curso que la persona acaba de dejar, con un token que dice lo correcto.
   */
  it("guarda toda la sesión renovada, no sólo el token", async () => {
    const { result } = renderHook(() => useRefreshSession(), { wrapper })

    result.current.mutate()

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    const stored = useAuthStore.getState()
    expect(stored.accessToken).toBe("fresh-jwt")
    expect(stored.expiresAt).toBe("2026-09-27T13:15:00.000Z")
    expect(stored.courseId).toBe("course-2")
    expect(stored.gradeName).toBe("Segundo")
    expect(stored.parallelName).toBe("B")
  })

  /** Sin cuerpo: el usuario a renovar sale del token, no de lo que el cliente mande. */
  it("no manda ningún dato del usuario", async () => {
    const { result } = renderHook(() => useRefreshSession(), { wrapper })

    result.current.mutate()

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(refresh).toHaveBeenCalledWith()
  })

  /**
   * Un fallo no puede dejar puesta media sesión. Si se guardara algo de una renovación rechazada,
   * la aplicación seguiría con un token que el servidor ya no acepta y sin saberlo.
   */
  it("no toca la sesión cuando la renovación falla", async () => {
    refresh.mockRejectedValue(new Error("401"))
    const { result } = renderHook(() => useRefreshSession(), { wrapper })

    result.current.mutate()

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(useAuthStore.getState().accessToken).toBeNull()
  })
})
