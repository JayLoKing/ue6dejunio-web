import { z } from "zod"

import {
  ciString,
  emailString,
  nameString,
  phoneString,
} from "@/lib/validation/rules"

export const createUserSchema = z.object({
  ci: ciString(),
  names: nameString("Nombres"),
  lastNames: nameString("Apellidos"),
  phone: phoneString(),
  email: emailString(),
  roleId: z.coerce.number().int().positive("Selecciona un rol"),
})

export type CreateUserFormValues = z.infer<typeof createUserSchema>

export const updateUserSchema = z.object({
  names: nameString("Nombres"),
  lastNames: nameString("Apellidos"),
  phone: phoneString(),
  roleId: z.coerce.number().int().positive("Selecciona un rol"),
  active: z.boolean(),
})

export type UpdateUserFormValues = z.infer<typeof updateUserSchema>
