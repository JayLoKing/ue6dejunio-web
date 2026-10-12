import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { renderHook, waitFor } from "@testing-library/react"
import { describe, expect, it, vi, beforeEach } from "vitest"

const activate = vi.hoisted(() => vi.fn())

vi.mock("../services/userService", () => ({
  default: { activate },
  UserService: { activate },
}))

const toastSuccess = vi.hoisted(() => vi.fn())
vi.mock("sonner", () => ({ toast: { success: toastSuccess, error: vi.fn() } }))

import { useActivateUser } from "./useActivateUser"

let qc: QueryClient

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={qc}>{children}</QueryClientProvider>
)

beforeEach(() => {
  vi.clearAllMocks()
  activate.mockResolvedValue({ id: "user-1", active: true })
  qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
})

/**
 * Las mismas claves que al dar de baja, y por la misma razón: habilitar una cuenta devuelve al
 * docente al selector del catálogo y cambia `homeroomTeacherActive` en sus cursos.
 */
const STALE_AFTER_ACTIVATION = [
  ["users"],
  ["catalog", "teachers"],
  ["courses"],
  ["course-overview"],
  // La lista de materias del docente: un curso que cambia de manos se la cambia a dos personas.
  ["teacher"],
]

describe("useActivateUser", () => {
  it("invalida los usuarios, el catálogo de docentes y los cursos", async () => {
    const invalidate = vi.spyOn(qc, "invalidateQueries")

    const { result } = renderHook(() => useActivateUser(), { wrapper })
    result.current.mutate("user-1")

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    const invalidated = invalidate.mock.calls.map((c) => c[0]?.queryKey)
    for (const key of STALE_AFTER_ACTIVATION) {
      expect(invalidated).toContainEqual(expect.arrayContaining(key))
    }
  })

  it("avisa que la cuenta quedó habilitada", async () => {
    const { result } = renderHook(() => useActivateUser(), { wrapper })
    result.current.mutate("user-1")

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(activate).toHaveBeenCalledWith("user-1")
    expect(toastSuccess).toHaveBeenCalledWith("Usuario habilitado.")
  })
})
