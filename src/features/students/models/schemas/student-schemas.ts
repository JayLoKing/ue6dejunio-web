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
