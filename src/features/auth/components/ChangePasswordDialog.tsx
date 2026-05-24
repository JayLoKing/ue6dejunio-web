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
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"

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
    formState: { errors },
  } = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordSchema),
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
          <div className="mx-auto mb-2 flex size-12 items-center justify-center rounded-full bg-univalle/10 text-univalle">
            <KeyRoundIcon className="size-6" />
          </div>
          <DialogTitle className="text-center">
            Cambio de contrasena obligatorio
          </DialogTitle>
          <DialogDescription className="text-center">
            Es tu primer acceso. Define una nueva contrasena para continuar.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} noValidate>
          <FieldGroup>
            <Field data-invalid={Boolean(errors.currentPassword) || undefined}>
              <FieldLabel htmlFor="currentPassword">
                Contrasena actual
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
              <FieldLabel htmlFor="newPassword">Nueva contrasena</FieldLabel>
              <Input
                id="newPassword"
                type="password"
                autoComplete="new-password"
                aria-invalid={Boolean(errors.newPassword) || undefined}
                {...register("newPassword")}
              />
              {errors.newPassword ? (
                <FieldError>{errors.newPassword.message}</FieldError>
              ) : (
                <FieldDescription>Minimo 8 caracteres.</FieldDescription>
              )}
            </Field>

            <Field data-invalid={Boolean(errors.confirmPassword) || undefined}>
              <FieldLabel htmlFor="confirmPassword">
                Confirmar contrasena
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
              className="w-full bg-univalle text-univalle-foreground hover:bg-univalle/90"
              disabled={isPending}
            >
              {isPending ? "Actualizando..." : "Actualizar y cerrar sesion"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
