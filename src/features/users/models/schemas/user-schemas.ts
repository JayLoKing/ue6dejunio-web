import { z } from "zod"

const phoneRegex = /^[-0-9+ ]*$/

export const createUserSchema = z.object({
  ci: z
    .string()
    .min(5, "Minimo 5 caracteres")
    .max(15, "Maximo 15 caracteres"),
  names: z.string().min(1, "Requerido").max(100),
  lastNames: z.string().min(1, "Requerido").max(100),
  phone: z
    .string()
    .max(20, "Maximo 20 caracteres")
    .regex(phoneRegex, "Solo digitos, +, - y espacios")
    .optional()
    .or(z.literal("")),
  email: z.string().email("Correo invalido").max(100),
  roleId: z.coerce.number().int().positive("Selecciona un rol"),
})

export type CreateUserFormValues = z.infer<typeof createUserSchema>

export const updateUserSchema = z.object({
  names: z.string().max(100).optional(),
  lastNames: z.string().max(100).optional(),
  phone: z
    .string()
    .max(20)
    .regex(phoneRegex)
    .optional()
    .or(z.literal("")),
  roleId: z.coerce.number().int().positive().optional(),
  active: z.boolean().optional(),
})

export type UpdateUserFormValues = z.infer<typeof updateUserSchema>
