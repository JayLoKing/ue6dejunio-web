import { z } from "zod"

export const studentPayloadSchema = z.object({
  rudeCode: z.string().min(1, "RUDE requerido").max(20),
  identityCard: z.string().min(1, "CI requerida").max(15),
  names: z.string().min(1, "Nombres requeridos").max(100),
  lastNames: z.string().min(1, "Apellidos requeridos").max(100),
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Formato yyyy-MM-dd"),
  gender: z.enum(["M", "F"]),
})

/**
 * Lo que pide el formulario de inscripción manual: los seis datos, aunque la API acepte menos. La
 * planilla de la escuela es la vía para inscribir sólo con el nombre; quien carga uno a mano lo
 * hace con la ficha completa en la mano.
 */
export type StudentFormValues = z.infer<typeof studentPayloadSchema>

const pad = (n: number): string => String(n).padStart(2, "0")

/**
 * Hoy como yyyy-MM-dd en la hora local, armado campo por campo: `toISOString` da la fecha en UTC, y
 * de noche en Bolivia ya sería mañana.
 */
const todayIso = (): string => {
  const d = new Date()
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

/**
 * Lo que pide la edición de un estudiante: el espejo de `UpdateStudentRequest` de la API. Sólo los
 * nombres son obligatorios; un opcional vacío queda vacío. La fecha se compara como texto, que en
 * yyyy-MM-dd ordena igual que la fecha.
 */
export const updateStudentSchema = z.object({
  rudeCode: z.string().trim().max(20, "Máximo 20 caracteres"),
  identityCard: z.string().trim().max(15, "Máximo 15 caracteres"),
  names: z
    .string()
    .trim()
    .min(1, "Nombres requeridos")
    .max(100, "Máximo 100 caracteres"),
  lastNames: z
    .string()
    .trim()
    .min(1, "Apellidos requeridos")
    .max(100, "Máximo 100 caracteres"),
  birthDate: z
    .string()
    .refine((v) => v === "" || /^\d{4}-\d{2}-\d{2}$/.test(v), {
      message: "Formato yyyy-MM-dd",
    })
    .refine((v) => v === "" || v < todayIso(), {
      message: "La fecha de nacimiento debe ser pasada",
    }),
  gender: z.enum(["", "M", "F"]),
})

export type StudentEditValues = z.infer<typeof updateStudentSchema>
