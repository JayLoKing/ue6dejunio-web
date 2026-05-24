import { z } from "zod"

export const studentPayloadSchema = z.object({
  rudeCode: z.string().min(1, "RUDE requerido").max(20),
  identityCard: z.string().min(1, "CI requerida").max(15),
  names: z.string().min(1, "Nombres requeridos").max(100),
  lastNames: z.string().min(1, "Apellidos requeridos").max(100),
  birthDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Formato yyyy-MM-dd"),
  gender: z.enum(["M", "F"]),
})

export const enrollSingleSchema = z.object({
  id_grade: z.coerce.number().int().positive("Selecciona grado"),
  id_parallel: z.coerce.number().int().positive("Selecciona paralelo"),
  student: studentPayloadSchema,
})

export type EnrollSingleValues = z.infer<typeof enrollSingleSchema>

export const enrollBatchSchema = z.object({
  id_grade: z.coerce.number().int().positive(),
  id_parallel: z.coerce.number().int().positive(),
  students: z.array(studentPayloadSchema).min(1, "Sin estudiantes"),
})
