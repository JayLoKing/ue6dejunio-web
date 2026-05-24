import { z } from "zod"

export const assignmentSchema = z.object({
  id_subject: z.string().uuid(),
  id_teacher: z.string().uuid("Selecciona docente"),
})

export const createClassGroupSchema = z.object({
  id_grade: z.coerce.number().int().positive("Selecciona grado"),
  id_parallel: z.coerce.number().int().positive("Selecciona paralelo"),
  assignments: z.array(assignmentSchema).min(1, "Marca al menos una materia"),
})

export type CreateClassGroupValues = z.infer<typeof createClassGroupSchema>
