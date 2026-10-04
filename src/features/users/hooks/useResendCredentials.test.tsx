import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { renderHook, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

const resendCredentials = vi.hoisted(() => vi.fn())
const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }))

vi.mock("../services/userService", () => ({
  UserService: { resendCredentials },
}))
vi.mock("sonner", () => ({ toast }))

import { useResendCredentials } from "./useResendCredentials"

let qc: QueryClient

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={qc}>{children}</QueryClientProvider>
)

beforeEach(() => {
  vi.clearAllMocks()
  resendCredentials.mockResolvedValue(undefined)
  qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
})

describe("useResendCredentials", () => {
  it("pide el reenvío del usuario y avisa que salió", async () => {
    const { result } = renderHook(() => useResendCredentials(), { wrapper })

    result.current.mutate("u-1")

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(resendCredentials).toHaveBeenCalledWith("u-1")
    expect(toast.success).toHaveBeenCalledWith(
      expect.stringContaining("Credenciales reenviadas")
    )
  })

  /** La lista decide el botón por `mustChangePassword`: tras reenviar, se relee. */
  it("relee la lista de usuarios", async () => {
    qc.setQueryData(["users", "list", {}], { content: [] })
    const { result } = renderHook(() => useResendCredentials(), { wrapper })

    result.current.mutate("u-1")

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(qc.getQueryState(["users", "list", {}])?.isInvalidated).toBe(true)
  })

  it("no avisa éxito cuando la API lo rechaza", async () => {
    resendCredentials.mockRejectedValue(new Error("409"))
    const { result } = renderHook(() => useResendCredentials(), { wrapper })

    result.current.mutate("u-1")

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(toast.success).not.toHaveBeenCalled()
  })
})
