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
  // Un número, no algo coercible: el Select ya entrega Number(v), así que el esquema nunca ve
  // un string. La coerción sólo ensanchaba la entrada a unknown, y era eso lo que obligaba a
  // los formularios a castear su propio resolver.
  roleId: z
    .number({ message: "Selecciona un rol" })
    .int()
    .positive("Selecciona un rol"),
})

export type CreateUserFormValues = z.infer<typeof createUserSchema>

export const updateUserSchema = z.object({
  names: nameString("Nombres"),
  lastNames: nameString("Apellidos"),
  phone: phoneString(),
  // Un número, no algo coercible: el Select ya entrega Number(v), así que el esquema nunca ve
  // un string. La coerción sólo ensanchaba la entrada a unknown, y era eso lo que obligaba a
  // los formularios a castear su propio resolver.
  roleId: z
    .number({ message: "Selecciona un rol" })
    .int()
    .positive("Selecciona un rol"),
  active: z.boolean(),
})

export type UpdateUserFormValues = z.infer<typeof updateUserSchema>
