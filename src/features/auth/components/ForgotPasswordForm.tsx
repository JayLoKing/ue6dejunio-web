import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Link } from "@tanstack/react-router"
import { ArrowLeftIcon, MailCheckIcon, SendIcon } from "lucide-react"

import { Button } from "@/components/animate-ui/components/buttons/button"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"

import {
  forgotPasswordSchema,
  type ForgotPasswordFormValues,
} from "../models/schemas/credentials-schema"
import { useForgotPassword } from "../hooks/usePasswordRecovery"

export function ForgotPasswordForm() {
  const [message, setMessage] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  })

  const { mutateAsync, isPending } = useForgotPassword()

  const onSubmit = handleSubmit(async (values) => {
    try {
      // Respuesta siempre genérica (no revela si el correo existe).
      const res = await mutateAsync(values)
      setMessage(res.message)
    } catch {
      /* interceptor dispara toast */
    }
  })

  const loading = isSubmitting || isPending

  // El éxito no es un formulario vacío con un cartel arriba: es otra pantalla. El campo se va, y
  // queda lo único que hay para hacer — ir al correo, o volver.
  if (message) {
    return (
      <div className="space-y-6">
        <div className="flex size-11 items-center justify-center rounded-full bg-primary/10 text-primary">
          <MailCheckIcon className="size-5" />
        </div>
        <div className="space-y-1.5">
          <p className="font-medium">Revisa tu correo</p>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {message}
          </p>
        </div>
        <Button variant="outline" className="h-11 w-full" asChild>
          <Link to="/auth/login">
            <ArrowLeftIcon data-icon="inline-start" />
            Volver al inicio de sesión
          </Link>
        </Button>
      </div>
    )
  }

  return (
    <form onSubmit={onSubmit} noValidate>
      <FieldGroup>
        <Field data-invalid={Boolean(errors.email) || undefined}>
          <FieldLabel htmlFor="email">Correo</FieldLabel>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="tucorreo@ue6.bo"
            className="h-11"
            aria-invalid={Boolean(errors.email) || undefined}
            {...register("email")}
          />
          {errors.email ? (
            <FieldError>{errors.email.message}</FieldError>
          ) : null}
        </Field>

        <div className="mt-2 space-y-2">
          <Button type="submit" className="h-11 w-full" disabled={loading}>
            <SendIcon data-icon="inline-start" />
            {loading ? "Enviando…" : "Enviar enlace"}
          </Button>
          <Button variant="ghost" className="h-11 w-full" asChild>
            <Link to="/auth/login">
              <ArrowLeftIcon data-icon="inline-start" />
              Volver
            </Link>
          </Button>
        </div>
      </FieldGroup>
    </form>
  )
}
