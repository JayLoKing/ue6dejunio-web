import { z } from "zod"

export const credentialsSchema = z.object({
  email: z
    .string({ message: "El correo es requerido" })
    .min(1, "El correo es requerido")
    .email("Correo electronico invalido"),
  password: z
    .string({ message: "La contrasena es requerida" })
    .min(6, "Minimo 6 caracteres"),
})

export type CredentialsFormValues = z.infer<typeof credentialsSchema>

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(6, "Minimo 6 caracteres"),
    newPassword: z.string().min(8, "Minimo 8 caracteres"),
    confirmPassword: z.string().min(8, "Minimo 8 caracteres"),
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
