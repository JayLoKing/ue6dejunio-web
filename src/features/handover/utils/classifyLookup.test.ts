import { describe, expect, it } from "vitest"

import { classifyLookup } from "./classifyLookup"
import type { UserLookup } from "../models/response/handover-response"

const found = (over: Partial<UserLookup> = {}): UserLookup => ({
  id: "u-1",
  fullName: "Ana Quispe",
  email: "ana@ue6.bo",
  role: "Teacher",
  active: true,
  ...over,
})

describe("classifyLookup", () => {
  it("un correo sin dueño pide crear la cuenta", () => {
    expect(classifyLookup("nuevo@ue6.bo", "dir@ue6.bo", null)).toEqual({
      kind: "new",
    })
  })

  it("una cuenta activa que no es Director se asciende", () => {
    const user = found()

    expect(classifyLookup(user.email, "dir@ue6.bo", user)).toEqual({
      kind: "promote",
      user,
    })
  })

  it("asciende también al Secretario", () => {
    const user = found({ role: "Secretary" })

    expect(classifyLookup(user.email, "dir@ue6.bo", user).kind).toBe("promote")
  })

  it("rechaza al que ya es Director", () => {
    const user = found({ role: "Director" })

    const outcome = classifyLookup(user.email, "otro@ue6.bo", user)

    expect(outcome).toEqual({
      kind: "blocked",
      message: "Esa cuenta ya es Director.",
    })
  })

  it("rechaza el propio correo, sin importar mayúsculas", () => {
    const me = found({ role: "Director", email: "dir@ue6.bo" })

    const outcome = classifyLookup("DIR@ue6.bo", "dir@ue6.bo", me)

    expect(outcome.kind).toBe("blocked")
    expect(outcome.kind === "blocked" && outcome.message).toMatch(/tu propio/i)
  })

  it("rechaza una cuenta dada de baja", () => {
    const user = found({ active: false })

    const outcome = classifyLookup(user.email, "dir@ue6.bo", user)

    expect(outcome.kind).toBe("blocked")
    expect(outcome.kind === "blocked" && outcome.message).toMatch(/de baja/i)
  })
})
