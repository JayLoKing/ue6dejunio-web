import { describe, expect, it } from "vitest"
import type { ZodType } from "zod"

import {
  ciString,
  cleanSpaces,
  emailString,
  isStrongPassword,
  nameString,
  PASSWORD_RULES,
  passwordString,
  phoneString,
  trimmedString,
} from "./rules"

/** The single message a failed parse shows the user, or undefined when it passes. */
const errorOf = (schema: ZodType, value: unknown): string | undefined => {
  const result = schema.safeParse(value)
  return result.success ? undefined : result.error.issues[0]?.message
}

const parsed = (schema: ZodType, value: unknown): unknown => {
  const result = schema.safeParse(value)
  if (!result.success) throw new Error(result.error.issues[0]?.message)
  return result.data
}

describe("cleanSpaces", () => {
  it("trims both ends", () => {
    expect(cleanSpaces("  Ana  ")).toBe("Ana")
  })

  it("collapses inner runs of spaces, tabs and newlines into one space", () => {
    expect(cleanSpaces("María \t\n  José")).toBe("María José")
  })

  it("turns a string of only whitespace into an empty one", () => {
    expect(cleanSpaces(" \t \n ")).toBe("")
  })

  it("leaves an already clean string as it was", () => {
    expect(cleanSpaces("Ciencias Naturales")).toBe("Ciencias Naturales")
  })
})

// Used for subject, knowledge-area and catalogue names, and the grades screen's free text.
describe("trimmedString", () => {
  it("defaults to 1..200 characters and names the field 'Campo'", () => {
    const schema = trimmedString({})
    expect(errorOf(schema, "")).toBe("Campo: mínimo 1 caracteres")
    expect(errorOf(schema, "a")).toBeUndefined()
    expect(errorOf(schema, "a".repeat(200))).toBeUndefined()
    expect(errorOf(schema, "a".repeat(201))).toBe(
      "Campo: máximo 200 caracteres"
    )
  })

  it("rejects a value made only of spaces, because it is cleaned before the length check", () => {
    expect(errorOf(trimmedString({ field: "Nombre" }), "     ")).toBe(
      "Nombre: mínimo 1 caracteres"
    )
  })

  it("measures the cleaned value, so surrounding and repeated spaces do not count", () => {
    const schema = trimmedString({ max: 5 })
    expect(parsed(schema, "  a  b  ")).toBe("a b")
    expect(errorOf(schema, `  ${"a".repeat(5)}  `)).toBeUndefined()
  })

  it("honours custom bounds at both edges", () => {
    const schema = trimmedString({ min: 3, max: 5, field: "Sigla" })
    expect(errorOf(schema, "ab")).toBe("Sigla: mínimo 3 caracteres")
    expect(errorOf(schema, "abc")).toBeUndefined()
    expect(errorOf(schema, "abcde")).toBeUndefined()
    expect(errorOf(schema, "abcdef")).toBe("Sigla: máximo 5 caracteres")
  })

  it("rejects a value that is not a string", () => {
    expect(errorOf(trimmedString({}), 42)).toBeDefined()
  })
})

// Names and last names of users and of the incoming Director in a handover.
describe("nameString", () => {
  const schema = nameString("Nombres")

  it("accepts Spanish letters with accents, diaeresis and ñ", () => {
    expect(errorOf(schema, "José Ñuflo Güemes")).toBeUndefined()
    expect(errorOf(schema, "ÁÉÍÓÚÜÑ áéíóúüñ")).toBeUndefined()
  })

  it("accepts an apostrophe and a hyphen inside a name", () => {
    expect(errorOf(schema, "O'Brien Pérez-Soto")).toBeUndefined()
  })

  it("returns the cleaned value", () => {
    expect(parsed(schema, "  Ana   María ")).toBe("Ana María")
  })

  it("requires something besides whitespace", () => {
    expect(errorOf(schema, "")).toBe("Nombres es requerido")
    expect(errorOf(schema, "   ")).toBe("Nombres es requerido")
  })

  it("rejects digits and symbols", () => {
    expect(errorOf(schema, "Ana2")).toBe("Nombres: solo letras")
    expect(errorOf(schema, "Ana.")).toBe("Nombres: solo letras")
    expect(errorOf(schema, "Ana@")).toBe("Nombres: solo letras")
  })

  it("rejects accented letters outside Spanish", () => {
    expect(errorOf(schema, "François")).toBe("Nombres: solo letras")
    expect(errorOf(schema, "Àngel")).toBe("Nombres: solo letras")
  })

  it("caps the cleaned length at 100 by default", () => {
    expect(errorOf(schema, "a".repeat(100))).toBeUndefined()
    expect(errorOf(schema, "a".repeat(101))).toBe(
      "Nombres: máximo 100 caracteres"
    )
  })

  it("takes a custom cap", () => {
    const short = nameString("Apellidos", 3)
    expect(errorOf(short, "abc")).toBeUndefined()
    expect(errorOf(short, "abcd")).toBe("Apellidos: máximo 3 caracteres")
  })
})

// User and handover CI. The pattern is the binding rule: 5..12 digits, then 0..3 letters.
describe("ciString", () => {
  const schema = ciString()

  it("accepts 5 to 12 digits", () => {
    expect(errorOf(schema, "12345")).toBeUndefined()
    expect(errorOf(schema, "123456789012")).toBeUndefined()
  })

  it("accepts up to three trailing complement letters, in either case", () => {
    expect(errorOf(schema, "1234567A")).toBeUndefined()
    expect(errorOf(schema, "1234567lp")).toBeUndefined()
    expect(errorOf(schema, "123456789012ABC")).toBeUndefined()
  })

  it("trims surrounding spaces before checking", () => {
    expect(parsed(schema, "  1234567  ")).toBe("1234567")
  })

  it("rejects fewer than 5 characters with the length message", () => {
    expect(errorOf(schema, "1234")).toBe("CI: mínimo 5 caracteres")
    expect(errorOf(schema, "   ")).toBe("CI: mínimo 5 caracteres")
  })

  it("rejects more than 15 characters with the length message", () => {
    expect(errorOf(schema, "1234567890123456")).toBe("CI: máximo 15 caracteres")
  })

  it("rejects 13 digits even though it fits in 15 characters", () => {
    expect(errorOf(schema, "1234567890123")).toBe("CI inválido")
  })

  it("rejects four complement letters", () => {
    expect(errorOf(schema, "1234567ABCD")).toBe("CI inválido")
  })

  it("rejects letters before the digits, separators and inner spaces", () => {
    expect(errorOf(schema, "A1234567")).toBe("CI inválido")
    expect(errorOf(schema, "1234567-1A")).toBe("CI inválido")
    expect(errorOf(schema, "123 4567")).toBe("CI inválido")
  })

  it("rejects ñ as a complement letter", () => {
    expect(errorOf(schema, "1234567Ñ")).toBe("CI inválido")
  })
})

// Login, password recovery, user creation and the handover's incoming Director.
describe("emailString", () => {
  const schema = emailString()

  it("trims and lowercases the address", () => {
    expect(parsed(schema, "  Ana.Perez@Colegio.EDU.BO ")).toBe(
      "ana.perez@colegio.edu.bo"
    )
  })

  it("rejects malformed addresses", () => {
    expect(errorOf(schema, "")).toBe("Correo inválido")
    expect(errorOf(schema, "ana")).toBe("Correo inválido")
    expect(errorOf(schema, "ana@")).toBe("Correo inválido")
    expect(errorOf(schema, "ana@colegio")).toBe("Correo inválido")
    expect(errorOf(schema, "ana perez@colegio.bo")).toBe("Correo inválido")
  })

  it("caps the address at 100 characters", () => {
    const at100 = `a@${"b".repeat(94)}.com`
    expect(at100).toHaveLength(100)
    expect(errorOf(schema, at100)).toBeUndefined()
    expect(errorOf(schema, `a${at100}`)).toBe("Correo muy largo")
  })
})

// Optional phone on users, profile and handover.
describe("phoneString", () => {
  const schema = phoneString()

  it("is optional: absent and empty both pass", () => {
    expect(errorOf(schema, undefined)).toBeUndefined()
    expect(errorOf(schema, "")).toBeUndefined()
  })

  it("accepts digits, plus, hyphen and inner spaces", () => {
    expect(errorOf(schema, "+591 7-1234567")).toBeUndefined()
  })

  it("trims surrounding spaces", () => {
    expect(parsed(schema, "  71234567 ")).toBe("71234567")
  })

  it("rejects letters, parentheses and dots", () => {
    expect(errorOf(schema, "7123abc")).toBe("Teléfono: solo números, + y -")
    expect(errorOf(schema, "(591)712")).toBe("Teléfono: solo números, + y -")
    expect(errorOf(schema, "712.345")).toBe("Teléfono: solo números, + y -")
  })

  it("caps the trimmed value at 20 characters", () => {
    expect(errorOf(schema, "1".repeat(20))).toBeUndefined()
    expect(errorOf(schema, ` ${"1".repeat(20)} `)).toBeUndefined()
    expect(errorOf(schema, "1".repeat(21))).toBe("Teléfono muy largo")
  })
})

// The checklist under the new-password field and the change/reset password schemas.
describe("PASSWORD_RULES", () => {
  const rule = (id: string) => {
    const found = PASSWORD_RULES.find((r) => r.id === id)
    if (!found) throw new Error(`no rule ${id}`)
    return found
  }

  it("lists the five requirements in the order the checklist shows them", () => {
    expect(PASSWORD_RULES.map((r) => r.id)).toEqual([
      "len",
      "upper",
      "lower",
      "digit",
      "special",
    ])
  })

  it("len: 8 characters is the boundary", () => {
    expect(rule("len").test("1234567")).toBe(false)
    expect(rule("len").test("12345678")).toBe(true)
  })

  it("upper and lower only see unaccented ASCII letters", () => {
    expect(rule("upper").test("abc")).toBe(false)
    expect(rule("upper").test("aBc")).toBe(true)
    expect(rule("upper").test("Ñ")).toBe(false)
    expect(rule("lower").test("ABC")).toBe(false)
    expect(rule("lower").test("AbC")).toBe(true)
    expect(rule("lower").test("ñ")).toBe(false)
  })

  it("digit needs at least one 0-9", () => {
    expect(rule("digit").test("abc")).toBe(false)
    expect(rule("digit").test("ab0")).toBe(true)
  })

  it("special counts anything outside A-Z, a-z and 0-9, including a space and ñ", () => {
    expect(rule("special").test("Abc123")).toBe(false)
    expect(rule("special").test("Abc!")).toBe(true)
    expect(rule("special").test("Abc 1")).toBe(true)
    expect(rule("special").test("Añc")).toBe(true)
  })
})

describe("isStrongPassword / passwordString", () => {
  it("accepts a password meeting all five rules at the 8-character boundary", () => {
    expect(isStrongPassword("Abcde1!x")).toBe(true)
    expect(errorOf(passwordString(), "Abcde1!x")).toBeUndefined()
  })

  it("rejects a password missing exactly one rule", () => {
    for (const weak of [
      "Abcd1!x",
      "abcde1!x",
      "ABCDE1!X",
      "Abcdef!x",
      "Abcde12x",
    ]) {
      expect(isStrongPassword(weak)).toBe(false)
      expect(errorOf(passwordString(), weak)).toBe(
        "La contraseña no cumple los requisitos"
      )
    }
  })

  it("rejects an empty password", () => {
    expect(isStrongPassword("")).toBe(false)
  })

  it("caps the length at 100, the API's own limit", () => {
    const atLimit = "Abcde1!" + "x".repeat(93)
    expect(atLimit).toHaveLength(100)
    expect(errorOf(passwordString(), atLimit)).toBeUndefined()
    expect(errorOf(passwordString(), atLimit + "x")).toBe(
      "Contraseña: máximo 100 caracteres"
    )
  })
})
