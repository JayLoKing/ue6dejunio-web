import { z } from "zod"

/** Collapse inner whitespace + trim ends. */
export const cleanSpaces = (raw: string): string =>
  raw.replace(/\s+/g, " ").trim()

/** Trimmed non-empty string. Transforms (cleans) before validating length. */
export const trimmedString = (opts: {
  min?: number
  max?: number
  field?: string
}) => {
  const { min = 1, max = 200, field = "Campo" } = opts
  return z
    .string()
    .transform(cleanSpaces)
    .pipe(
      z
        .string()
        .min(min, `${field}: mínimo ${min} caracteres`)
        .max(max, `${field}: máximo ${max} caracteres`)
    )
}

// Letters incl. Spanish accents, ñ, spaces, apostrophe, hyphen.
const NAME_RE = /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ' -]+$/

/** Names / lastNames — letters only (accents allowed), cleaned. */
export const nameString = (field: string, max = 100) =>
  z
    .string()
    .transform(cleanSpaces)
    .pipe(
      z
        .string()
        .min(1, `${field} es requerido`)
        .max(max, `${field}: máximo ${max} caracteres`)
        .regex(NAME_RE, `${field}: solo letras`)
    )

/** Bolivian-style CI: 5-15 digits, optional 1-2 trailing complement letters. */
export const ciString = () =>
  z
    .string()
    .transform((s) => s.trim())
    .pipe(
      z
        .string()
        .min(5, "CI: mínimo 5 caracteres")
        .max(15, "CI: máximo 15 caracteres")
        .regex(/^[0-9]{5,12}[A-Za-z]{0,3}$/, "CI inválido")
    )

/** Email, cleaned + lowercased. */
export const emailString = () =>
  z
    .string()
    .transform((s) => s.trim().toLowerCase())
    .pipe(z.string().email("Correo inválido").max(100, "Correo muy largo"))

/** Phone: digits, +, -, spaces. Optional. */
export const phoneString = () =>
  z
    .string()
    .transform((s) => s.trim())
    .pipe(
      z
        .string()
        .max(20, "Teléfono muy largo")
        .regex(/^[-0-9+ ]*$/, "Teléfono: solo números, + y -")
    )
    .optional()
    .or(z.literal(""))

/** RUDE code: alphanumeric, up to 20. */
export const rudeString = () =>
  z
    .string()
    .transform((s) => s.trim())
    .pipe(
      z
        .string()
        .min(1, "RUDE requerido")
        .max(20, "RUDE: máximo 20 caracteres")
        .regex(/^[0-9A-Za-z]+$/, "RUDE inválido")
    )

// ---- Password strength ----

export interface PasswordRule {
  id: string
  label: string
  test: (v: string) => boolean
}

export const PASSWORD_RULES: PasswordRule[] = [
  { id: "len", label: "Mínimo 8 caracteres", test: (v) => v.length >= 8 },
  { id: "upper", label: "Una mayúscula", test: (v) => /[A-Z]/.test(v) },
  { id: "lower", label: "Una minúscula", test: (v) => /[a-z]/.test(v) },
  { id: "digit", label: "Un número", test: (v) => /[0-9]/.test(v) },
  {
    id: "special",
    label: "Un carácter especial",
    test: (v) => /[^A-Za-z0-9]/.test(v),
  },
]

export const isStrongPassword = (v: string): boolean =>
  PASSWORD_RULES.every((r) => r.test(v))

export const passwordString = () =>
  z.string().refine(isStrongPassword, {
    message: "La contraseña no cumple los requisitos",
  })
