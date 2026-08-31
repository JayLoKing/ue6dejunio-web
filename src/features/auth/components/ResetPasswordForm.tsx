import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Link } from "@tanstack/react-router"
import { ArrowLeftIcon, KeyRoundIcon, TriangleAlertIcon } from "lucide-react"

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
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { PasswordRequirements } from "@/components/shared/PasswordRequirements"

import {
  resetPasswordSchema,
  type ResetPasswordFormValues,
} from "../models/schemas/credentials-schema"
import { useResetPassword } from "../hooks/usePasswordRecovery"

export interface ResetPasswordFormProps {
  token: string | null
}

/** Sin token: enlace inválido. Con token: delega al formulario. */
export function ResetPasswordForm({ token }: ResetPasswordFormProps) {
  if (!token) {
    return (
      <Card className="w-full max-w-md border-destructive/30 shadow-lg">
        <CardHeader className="text-center">
          <TriangleAlertIcon className="mx-auto size-10 text-destructive" />
          <CardTitle className="text-xl">Enlace inválido</CardTitle>
          <CardDescription>
            El enlace de recuperación no tiene token o expiró. Solicita uno
            nuevo.
          </CardDescription>
        </CardHeader>
        <CardFooter>
          <Button variant="outline" className="w-full" asChild>
            <Link to="/auth/forgot-password">Solicitar nuevo enlace</Link>
          </Button>
        </CardFooter>
      </Card>
    )
  }
  return <ResetForm token={token} />
}

function ResetForm({ token }: { token: string }) {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { newPassword: "", confirmPassword: "" },
  })

  const { mutateAsync, isPending } = useResetPassword()
  const newPassword = watch("newPassword")

  const onSubmit = handleSubmit(async (values) => {
    try {
      await mutateAsync({ token, newPassword: values.newPassword })
    } catch {
      /* interceptor dispara toast */
    }
  })

  const loading = isSubmitting || isPending

  return (
    <Card className="w-full max-w-md border-univalle/20 shadow-lg">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Nueva contraseña</CardTitle>
        <CardDescription>Define tu nueva contraseña.</CardDescription>
      </CardHeader>
      <CardContent>
        <form id="reset-form" onSubmit={onSubmit} noValidate>
          <FieldGroup>
            <Field data-invalid={Boolean(errors.newPassword) || undefined}>
              <FieldLabel htmlFor="newPassword">Nueva contraseña</FieldLabel>
              <Input
                id="newPassword"
                type="password"
                autoComplete="new-password"
                aria-invalid={Boolean(errors.newPassword) || undefined}
                {...register("newPassword")}
              />
              {errors.newPassword ? (
                <FieldError>{errors.newPassword.message}</FieldError>
              ) : null}
              <PasswordRequirements value={newPassword} />
            </Field>

            <Field data-invalid={Boolean(errors.confirmPassword) || undefined}>
              <FieldLabel htmlFor="confirmPassword">
                Confirmar contraseña
              </FieldLabel>
              <Input
                id="confirmPassword"
                type="password"
                autoComplete="new-password"
                aria-invalid={Boolean(errors.confirmPassword) || undefined}
                {...register("confirmPassword")}
              />
              {errors.confirmPassword ? (
                <FieldError>{errors.confirmPassword.message}</FieldError>
              ) : null}
            </Field>
          </FieldGroup>
        </form>
      </CardContent>
      <CardFooter className="flex flex-col gap-2">
        <Button
          type="submit"
          form="reset-form"
          className="w-full bg-univalle text-univalle-foreground hover:bg-univalle/90"
          disabled={loading}
        >
          <KeyRoundIcon data-icon="inline-start" />
          {loading ? "Guardando…" : "Restablecer contraseña"}
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
