import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Link } from "@tanstack/react-router"
import { LogInIcon } from "lucide-react"

import { Button } from "@/components/animate-ui/components/buttons/button"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"

import {
  credentialsSchema,
  type CredentialsFormValues,
} from "../models/schemas/credentials-schema"
import { useLogin } from "../hooks/useLogin"

export function LoginForm() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CredentialsFormValues>({
    resolver: zodResolver(credentialsSchema),
    defaultValues: { email: "", password: "" },
  })

  const { mutateAsync, isPending } = useLogin()

  const onSubmit = handleSubmit(async (values) => {
    try {
      await mutateAsync(values)
    } catch {
      /* axios interceptor ya dispara toast */
    }
  })

  const loading = isSubmitting || isPending

  return (
    // Sin Card. El panel de papel de AuthLayout ya es la superficie, y una tarjeta encima sería una
    // segunda caja dibujando el mismo borde: dos marcos para un solo contenido.
    <form onSubmit={onSubmit} noValidate>
      <FieldGroup>
        <Field data-invalid={Boolean(errors.email) || undefined}>
          <FieldLabel htmlFor="email">Correo</FieldLabel>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="director@ue6.bo"
            className="h-11"
            aria-invalid={Boolean(errors.email) || undefined}
            {...register("email")}
          />
          {/* La ayuda sólo cuando hay algo que decir. "Tu correo" debajo de un campo rotulado
              "Correo" era una línea que ocupaba lugar sin agregar nada. */}
          {errors.email ? (
            <FieldError>{errors.email.message}</FieldError>
          ) : null}
        </Field>

        <Field data-invalid={Boolean(errors.password) || undefined}>
          <div className="flex items-baseline justify-between gap-3">
            <FieldLabel htmlFor="password">Contraseña</FieldLabel>
            {/* Junto al campo que no se recuerda, no al final del formulario: acá es donde uno se
                da cuenta de que la olvidó. */}
            <Link
              to="/auth/forgot-password"
              className="text-xs text-muted-foreground underline-offset-4 transition-colors hover:text-primary hover:underline"
            >
              ¿La olvidaste?
            </Link>
          </div>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            className="h-11"
            aria-invalid={Boolean(errors.password) || undefined}
            {...register("password")}
          />
          {errors.password ? (
            <FieldError>{errors.password.message}</FieldError>
          ) : null}
        </Field>

        <Button type="submit" className="mt-2 h-11 w-full" disabled={loading}>
          <LogInIcon data-icon="inline-start" />
          {loading ? "Ingresando…" : "Ingresar"}
        </Button>
      </FieldGroup>
    </form>
  )
}
