import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { renderHook, waitFor } from "@testing-library/react"
import { describe, expect, it, vi, beforeEach } from "vitest"

const deactivate = vi.hoisted(() => vi.fn())

vi.mock("../services/userService", () => ({
  default: { deactivate },
  UserService: { deactivate },
}))

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

import { useDeactivateUser } from "./useDeactivateUser"

let qc: QueryClient

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={qc}>{children}</QueryClientProvider>
)

beforeEach(() => {
  vi.clearAllMocks()
  deactivate.mockResolvedValue(undefined)
  qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
})

/** Las claves que quedan viejas cuando una cuenta se da de baja. */
const STALE_AFTER_DEACTIVATION = [
  ["users"],
  ["catalog", "teachers"],
  ["courses"],
]

describe("useDeactivateUser", () => {
  /**
   * Dar de baja a un docente cambia lo que la pantalla de Cursos puede hacer.
   *
   * El curso lleva `homeroomTeacherActive`, y el diálogo de docente de aula lo usa para decidir si
   * bloquea la reasignación. Sin invalidar la consulta de cursos, el Director da de baja al que se
   * va, vuelve a Cursos y sigue leyendo "primero dale de baja en Usuarios" — sobre alguien que
   * acaba de dar de baja. `useAllCourses` tiene `staleTime` de cinco minutos, así que no se
   * corrige sola: hay que recargar la página entera con F5.
   */
  it("invalida también los cursos, no sólo los usuarios y el catálogo", async () => {
    const invalidate = vi.spyOn(qc, "invalidateQueries")

    const { result } = renderHook(() => useDeactivateUser(), { wrapper })
    result.current.mutate("user-1")

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    const invalidated = invalidate.mock.calls.map((c) => c[0]?.queryKey)
    for (const key of STALE_AFTER_DEACTIVATION) {
      expect(invalidated).toContainEqual(expect.arrayContaining(key))
    }
  })
})
