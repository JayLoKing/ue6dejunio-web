import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Link } from "@tanstack/react-router"
import { ArrowLeftIcon, KeyRoundIcon, TriangleAlertIcon } from "lucide-react"

import { Button } from "@/components/animate-ui/components/buttons/button"
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
      <div className="space-y-6">
        <div className="flex size-11 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <TriangleAlertIcon className="size-5" />
        </div>
        <div className="space-y-1.5">
          <p className="font-medium">Enlace inválido</p>
          <p className="text-sm leading-relaxed text-muted-foreground">
            El enlace de recuperación no tiene token o expiró. Solicita uno
            nuevo.
          </p>
        </div>
        <Button variant="outline" className="h-11 w-full" asChild>
          <Link to="/auth/forgot-password">Solicitar nuevo enlace</Link>
        </Button>
      </div>
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
    <form onSubmit={onSubmit} noValidate>
      <FieldGroup>
        <Field data-invalid={Boolean(errors.newPassword) || undefined}>
          <FieldLabel htmlFor="newPassword">Nueva contraseña</FieldLabel>
          <Input
            id="newPassword"
            type="password"
            autoComplete="new-password"
            className="h-11"
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
            className="h-11"
            aria-invalid={Boolean(errors.confirmPassword) || undefined}
            {...register("confirmPassword")}
          />
          {errors.confirmPassword ? (
            <FieldError>{errors.confirmPassword.message}</FieldError>
          ) : null}
        </Field>

        <div className="mt-2 space-y-2">
          <Button type="submit" className="h-11 w-full" disabled={loading}>
            <KeyRoundIcon data-icon="inline-start" />
            {loading ? "Guardando…" : "Restablecer contraseña"}
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
