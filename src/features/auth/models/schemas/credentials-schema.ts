import { z } from "zod"

import { emailString, passwordString } from "@/lib/validation/rules"

export const credentialsSchema = z.object({
  email: emailString(),
  password: z
    .string({ message: "La contrasena es requerida" })
    .min(1, "La contrasena es requerida"),
})

export type CredentialsFormValues = z.infer<typeof credentialsSchema>

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Contrasena actual requerida"),
    newPassword: passwordString(),
    confirmPassword: z.string().min(1, "Confirma la contrasena"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Las contrasenas no coinciden",
    path: ["confirmPassword"],
  })

export type ChangePasswordFormValues = z.infer<typeof changePasswordSchema>

export const credentialResponseSchema = z.object({
  userId: z.string(),
  email: z.string(),
  fullName: z.string(),
  role: z.string(),
  accessToken: z.string(),
  tokenType: z.string(),
  expiresAt: z.string(),
  mustChangePassword: z.boolean(),
  gradeName: z.string().nullable(),
  parallelName: z.string().nullable(),
})
