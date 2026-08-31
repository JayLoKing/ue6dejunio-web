import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Link } from "@tanstack/react-router"
import { ArrowLeftIcon, MailCheckIcon, SendIcon } from "lucide-react"

import { Button } from "@/components/animate-ui/components/buttons/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Field,
  FieldDescription,
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

  if (message) {
    return (
      <Card className="w-full max-w-md border-univalle/20 shadow-lg">
        <CardHeader className="text-center">
          <MailCheckIcon className="mx-auto size-10 text-univalle" />
          <CardTitle className="text-xl">Revisa tu correo</CardTitle>
          <CardDescription>{message}</CardDescription>
        </CardHeader>
        <CardFooter>
          <Button variant="outline" className="w-full" asChild>
            <Link to="/auth/login">
              <ArrowLeftIcon data-icon="inline-start" />
              Volver al inicio de sesión
            </Link>
          </Button>
        </CardFooter>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md border-univalle/20 shadow-lg">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Recuperar contraseña</CardTitle>
        <CardDescription>
          Ingresa tu correo y te enviaremos un enlace para restablecerla.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form id="forgot-form" onSubmit={onSubmit} noValidate>
          <FieldGroup>
            <Field data-invalid={Boolean(errors.email) || undefined}>
              <FieldLabel htmlFor="email">Correo</FieldLabel>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="tucorreo@ue6.bo"
                aria-invalid={Boolean(errors.email) || undefined}
                {...register("email")}
              />
              {errors.email ? (
                <FieldError>{errors.email.message}</FieldError>
              ) : (
                <FieldDescription>
                  El correo asociado a tu cuenta.
                </FieldDescription>
              )}
            </Field>
          </FieldGroup>
        </form>
      </CardContent>
      <CardFooter className="flex flex-col gap-2">
        <Button
          type="submit"
          form="forgot-form"
          className="w-full bg-univalle text-univalle-foreground hover:bg-univalle/90"
          disabled={loading}
        >
          <SendIcon data-icon="inline-start" />
          {loading ? "Enviando…" : "Enviar enlace"}
        </Button>
        <Button variant="ghost" className="w-full" asChild>
          <Link to="/auth/login">
            <ArrowLeftIcon data-icon="inline-start" />
            Volver
          </Link>
        </Button>
      </CardFooter>
    </Card>
  )
}
