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
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
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
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
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
          <DialogTitle>Cambiar contrasena</DialogTitle>
          <DialogDescription>
            Tras cambiarla deberas iniciar sesion nuevamente.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} noValidate>
          <FieldGroup>
            <Field data-invalid={Boolean(errors.currentPassword) || undefined}>
              <FieldLabel htmlFor="cpm-current">Contrasena actual</FieldLabel>
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
              <FieldLabel htmlFor="cpm-new">Nueva contrasena</FieldLabel>
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
              <FieldLabel htmlFor="cpm-confirm">Confirmar contrasena</FieldLabel>
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
              className="bg-univalle text-univalle-foreground hover:bg-univalle/90"
              disabled={isPending}
            >
              {isPending ? "Actualizando..." : "Actualizar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
