import { z } from "zod"

import { emailString, passwordString } from "@/lib/validation/rules"

export const credentialsSchema = z.object({
  email: emailString(),
  password: z
    .string({ message: "La contraseña es requerida" })
    .min(1, "La contraseña es requerida"),
})

export type CredentialsFormValues = z.infer<typeof credentialsSchema>

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Contraseña actual requerida"),
    newPassword: passwordString(),
    confirmPassword: z.string().min(1, "Confirma la contraseña"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  })

export type ChangePasswordFormValues = z.infer<typeof changePasswordSchema>

export const forgotPasswordSchema = z.object({
  email: emailString(),
})

export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>

export const resetPasswordSchema = z
  .object({
    newPassword: passwordString(),
    confirmPassword: z.string().min(1, "Confirma la contraseña"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  })

export type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>
