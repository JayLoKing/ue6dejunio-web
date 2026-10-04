import { beforeEach, describe, expect, it, vi } from "vitest"

const get = vi.hoisted(() => vi.fn())

vi.mock("@/lib/axios", () => ({
  httpClient: { get, post: vi.fn(), delete: vi.fn() },
}))

import { HandoverService } from "./handoverService"

beforeEach(() => vi.clearAllMocks())

/** Un 204 llega con `data` vacío: sin esta conversión la pantalla leería "" como un cambio. */
describe("HandoverService: 204 es 'no hay'", () => {
  it("pending devuelve null ante un 204", async () => {
    get.mockResolvedValue({ status: 204, data: "" })

    await expect(HandoverService.pending()).resolves.toBeNull()
  })

  it("pending devuelve el cambio cuando hay uno", async () => {
    const body = { id: "h-1" }
    get.mockResolvedValue({ status: 200, data: body })

    await expect(HandoverService.pending()).resolves.toBe(body)
  })

  it("lookup devuelve null ante un 204 y manda el correo como parámetro", async () => {
    get.mockResolvedValue({ status: 204, data: "" })

    await expect(HandoverService.lookup("x@ue6.bo")).resolves.toBeNull()
    expect(get).toHaveBeenCalledWith(
      "/users/lookup",
      expect.objectContaining({ params: { email: "x@ue6.bo" } })
    )
  })
})
