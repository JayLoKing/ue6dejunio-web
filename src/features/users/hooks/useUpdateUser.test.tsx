import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { renderHook, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

const update = vi.hoisted(() => vi.fn())
const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }))

vi.mock("../services/userService", () => ({
  UserService: { update },
}))
vi.mock("sonner", () => ({ toast }))

import { useUpdateUser } from "./useUpdateUser"

let qc: QueryClient

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={qc}>{children}</QueryClientProvider>
)

const saved = { names: "Ana", lastNames: "Quispe" }

beforeEach(() => {
  vi.clearAllMocks()
  qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
})

describe("useUpdateUser", () => {
  it("avisa que el usuario se actualizó", async () => {
    update.mockResolvedValue(saved)
    const { result } = renderHook(() => useUpdateUser(), { wrapper })

    result.current.mutate({ id: "u-1", payload: { names: "Ana" } })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(toast.success).toHaveBeenCalledWith(
      "Usuario Ana Quispe actualizado."
    )
  })

  /**
   * Corregir el correo de quien nunca entró le manda una contraseña nueva: el Director tiene que
   * saber que salió un correo en su nombre.
   */
  it("avisa que las credenciales se reenviaron al nuevo correo", async () => {
    update.mockResolvedValue({ ...saved, credentialsResent: true })
    const { result } = renderHook(() => useUpdateUser(), { wrapper })

    result.current.mutate({ id: "u-1", payload: { email: "ana@ue6.bo" } })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(toast.success).toHaveBeenCalledTimes(1)
    expect(toast.success).toHaveBeenCalledWith(
      "Se reenviaron las credenciales al nuevo correo.",
      expect.objectContaining({
        description: "Usuario Ana Quispe actualizado.",
      })
    )
  })

  it("no avisa éxito cuando la API lo rechaza", async () => {
    update.mockRejectedValue(new Error("409"))
    const { result } = renderHook(() => useUpdateUser(), { wrapper })

    result.current.mutate({ id: "u-1", payload: { email: "otro@ue6.bo" } })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(toast.success).not.toHaveBeenCalled()
  })
})
