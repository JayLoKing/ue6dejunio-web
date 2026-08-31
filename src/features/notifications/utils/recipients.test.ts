import { describe, expect, it } from "vitest"

import { recipientsFrom } from "./recipients"
import type { UsersListItem } from "@/features/users/models/response/user-response"

const user = (over: Partial<UsersListItem>): UsersListItem => ({
  id: "1",
  ci: "123",
  names: "Ana",
  lastNames: "Quispe",
  phone: null,
  email: "ana@ue6.bo",
  role: "TEACHER",
  active: true,
  ...over,
})

describe("recipientsFrom", () => {
  it("takes the teachers and the secretary", () => {
    const list = recipientsFrom([
      user({ id: "t", role: "TEACHER" }),
      user({ id: "s", role: "SECRETARY" }),
    ])

    expect(list.map((r) => r.id)).toEqual(["t", "s"])
  })

  it("reads a role however the server spells it", () => {
    const list = recipientsFrom([
      user({ id: "t", role: "Teacher" }),
      user({ id: "s", role: "secretary" }),
    ])

    expect(list.map((r) => r.id)).toEqual(["t", "s"])
  })

  it("leaves out the Director, who is the one writing", () => {
    expect(recipientsFrom([user({ role: "DIRECTOR" })])).toEqual([])
  })

  it("leaves out whoever no longer works here", () => {
    expect(recipientsFrom([user({ role: "TEACHER", active: false })])).toEqual(
      []
    )
  })

  it("names a recipient the way the Director knows them", () => {
    const [only] = recipientsFrom([
      user({ id: "t", names: "Ana María", lastNames: "Quispe Mamani" }),
    ])

    expect(only).toEqual({
      id: "t",
      fullName: "Ana María Quispe Mamani",
    })
  })
})
