import { describe, expect, it } from "vitest"

import {
  forgotPasswordSchema,
  resetPasswordSchema,
} from "./credentials-schema"

describe("forgotPasswordSchema", () => {
  it("accepts a valid email", () => {
    expect(forgotPasswordSchema.safeParse({ email: "a@ue6.bo" }).success).toBe(
      true,
    )
  })

  it("rejects a malformed email", () => {
    expect(forgotPasswordSchema.safeParse({ email: "not-an-email" }).success).toBe(
      false,
    )
  })
})

describe("resetPasswordSchema", () => {
  const strong = "Docente**7"

  it("accepts matching strong passwords", () => {
    const r = resetPasswordSchema.safeParse({
      newPassword: strong,
      confirmPassword: strong,
    })
    expect(r.success).toBe(true)
  })

  it("rejects when passwords do not match", () => {
    const r = resetPasswordSchema.safeParse({
      newPassword: strong,
      confirmPassword: "Otra**8clave",
    })
    expect(r.success).toBe(false)
    if (!r.success) {
      expect(r.error.issues.some((i) => i.path.includes("confirmPassword"))).toBe(
        true,
      )
    }
  })

  it("rejects a weak password", () => {
    const r = resetPasswordSchema.safeParse({
      newPassword: "weak",
      confirmPassword: "weak",
    })
    expect(r.success).toBe(false)
  })
})
