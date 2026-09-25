import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { PasswordRequirements } from "@/components/shared/PasswordRequirements"

import {
  changePasswordSchema,
  type ChangePasswordFormValues,
} from "../models/schemas/credentials-schema"
import { useChangePassword } from "../hooks/useChangePassword"

export interface ChangePasswordMenuDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ChangePasswordMenuDialog({
  open,
  onOpenChange,
}: ChangePasswordMenuDialogProps) {
  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordSchema),
    mode: "onChange",
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  })

  const { mutateAsync, isPending } = useChangePassword()

  const onSubmit = handleSubmit(async (values) => {
    try {
      await mutateAsync({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      })
      reset()
    } catch {
      /* toast via interceptor */
    }
  })

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o)
        if (!o) reset()
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Cambiar contraseña</DialogTitle>
          <DialogDescription>
            Tras cambiarla deberás iniciar sesión nuevamente.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} noValidate>
          <FieldGroup>
            <Field data-invalid={Boolean(errors.currentPassword) || undefined}>
              <FieldLabel htmlFor="cpm-current">Contraseña actual</FieldLabel>
              <Input
                id="cpm-current"
                type="password"
                autoComplete="current-password"
                {...register("currentPassword")}
              />
              {errors.currentPassword ? (
                <FieldError>{errors.currentPassword.message}</FieldError>
              ) : null}
            </Field>

            <Field data-invalid={Boolean(errors.newPassword) || undefined}>
              <FieldLabel htmlFor="cpm-new">Nueva contraseña</FieldLabel>
              <Input
                id="cpm-new"
                type="password"
                autoComplete="new-password"
                {...register("newPassword")}
              />
              {errors.newPassword ? (
                <FieldError>{errors.newPassword.message}</FieldError>
              ) : null}
              <div className="pt-1">
                <PasswordRequirements value={watch("newPassword") ?? ""} />
              </div>
            </Field>

            <Field data-invalid={Boolean(errors.confirmPassword) || undefined}>
              <FieldLabel htmlFor="cpm-confirm">
                Confirmar contraseña
              </FieldLabel>
              <Input
                id="cpm-confirm"
                type="password"
                autoComplete="new-password"
                {...register("confirmPassword")}
              />
              {errors.confirmPassword ? (
                <FieldError>{errors.confirmPassword.message}</FieldError>
              ) : null}
            </Field>
          </FieldGroup>

          <DialogFooter className="mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="bg-brand text-brand-foreground hover:bg-brand/90"
              disabled={isPending}
            >
              {isPending ? "Actualizando…" : "Actualizar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
