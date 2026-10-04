import { z } from "zod"

import {
  ciString,
  emailString,
  nameString,
  phoneString,
} from "@/lib/validation/rules"

export const handoverEmailSchema = z.object({
  email: emailString(),
})

export type HandoverEmailFormValues = z.infer<typeof handoverEmailSchema>

/** Los mismos datos y reglas que el alta de usuario, sin rol: el rol es Director por definición. */
export const newDirectorSchema = z.object({
  ci: ciString(),
  names: nameString("Nombres"),
  lastNames: nameString("Apellidos"),
  phone: phoneString(),
})

export type NewDirectorFormValues = z.infer<typeof newDirectorSchema>

/** Lo que hay que escribir para confirmar: una palabra que no se teclea por reflejo. */
export const HANDOVER_CONFIRM_WORD = "TRANSFERIR"
