import { z } from "zod"

const envSchema = z.object({
  VITE_API_URL: z
    .string({ message: "VITE_API_URL es requerida" })
    .url("VITE_API_URL debe ser una URL válida"),
})

export type AppEnv = z.infer<typeof envSchema>

const parsed = envSchema.safeParse(import.meta.env)

if (!parsed.success) {
  const issues = parsed.error.issues
    .map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`)
    .join("\n")

  // La única consola que sobrevive a propósito: es lo último que se ve antes de que la app se
  // niegue a arrancar, y sin este texto el error de abajo no dice qué variable falta.
  console.error(
    `\n[env] Variables de entorno inválidas o faltantes:\n${issues}\n\nRevisa tu archivo .env contra .env.example.\n`
  )

  throw new Error("Variables de entorno inválidas. Revisa la consola.")
}

export const env: AppEnv = Object.freeze(parsed.data)
