import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { KeyRoundIcon } from "lucide-react"

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

export interface ChangePasswordDialogProps {
  open: boolean
}

export function ChangePasswordDialog({ open }: ChangePasswordDialogProps) {
  const {
    register,
    handleSubmit,
    watch,
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
    } catch {
      /* toast via interceptor */
    }
  })

  return (
    <Dialog open={open}>
      <DialogContent
        className="sm:max-w-md"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
        showCloseButton={false}
      >
        <DialogHeader>
          <div className="mx-auto mb-2 flex size-12 items-center justify-center rounded-full bg-brand/10 text-brand">
            <KeyRoundIcon className="size-6" />
          </div>
          <DialogTitle className="text-center">
            Cambio de contraseña obligatorio
          </DialogTitle>
          <DialogDescription className="text-center">
            Es tu primer acceso. Define una nueva contraseña para continuar.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} noValidate>
          <FieldGroup>
            <Field data-invalid={Boolean(errors.currentPassword) || undefined}>
              <FieldLabel htmlFor="currentPassword">
                Contraseña actual
              </FieldLabel>
              <Input
                id="currentPassword"
                type="password"
                autoComplete="current-password"
                aria-invalid={Boolean(errors.currentPassword) || undefined}
                {...register("currentPassword")}
              />
              {errors.currentPassword ? (
                <FieldError>{errors.currentPassword.message}</FieldError>
              ) : null}
            </Field>

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
              <div className="pt-1">
                <PasswordRequirements value={watch("newPassword") ?? ""} />
              </div>
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

          <DialogFooter className="mt-6">
            <Button
              type="submit"
              className="w-full bg-brand text-brand-foreground hover:bg-brand/90"
              disabled={isPending}
            >
              {isPending ? "Actualizando…" : "Actualizar y cerrar sesión"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
