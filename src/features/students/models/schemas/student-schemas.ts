import { z } from "zod"

export const studentPayloadSchema = z.object({
  rudeCode: z.string().min(1, "RUDE requerido").max(20),
  identityCard: z.string().min(1, "CI requerida").max(15),
  names: z.string().min(1, "Nombres requeridos").max(100),
  lastNames: z.string().min(1, "Apellidos requeridos").max(100),
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Formato yyyy-MM-dd"),
  gender: z.enum(["M", "F"]),
})
