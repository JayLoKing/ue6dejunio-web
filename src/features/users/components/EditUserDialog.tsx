import { useEffect } from "react"
import { useForm, Controller } from "react-hook-form"
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
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import {
  updateUserSchema,
  type UpdateUserFormValues,
} from "../models/schemas/user-schemas"
import { useUpdateUser } from "../hooks/useUpdateUser"
import { ROLES, roleOptionsFor } from "../types"
import type { UsersListItem } from "../models/response/user-response"

export interface EditUserDialogProps {
  user: UsersListItem | null
  onClose: () => void
}

const roleIdFromName = (role: string): number =>
  ROLES.find((r) => r.name === role.toUpperCase())?.id ?? 3

export function EditUserDialog({ user, onClose }: EditUserDialogProps) {
  // Dirección no se otorga desde acá, pero si la persona ya la tiene hay que poder mostrarla.
  const roleOptions = roleOptionsFor(user?.role ?? "")
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<UpdateUserFormValues>({
    resolver: zodResolver(updateUserSchema),
    defaultValues: {
      ci: "",
      names: "",
      lastNames: "",
      phone: "",
      roleId: 3,
      email: "",
    },
  })

  const { mutateAsync, isPending } = useUpdateUser()

  useEffect(() => {
    if (user) {
      reset({
        ci: user.ci,
        names: user.names,
        lastNames: user.lastNames,
        phone: user.phone ?? "",
        roleId: roleIdFromName(user.role),
        email: user.email,
      })
    }
  }, [user, reset])

  const onSubmit = handleSubmit(async (values) => {
    if (!user) return
    // El esquema normaliza (minúsculas, sin espacios), así que se compara contra lo guardado
    // normalizado igual. Mandarlo sin cambios haría que un correo guardado con mayúsculas contara
    // como corregido, y a quien nunca entró le saldría una contraseña nueva.
    const emailChanged = values.email !== user.email.trim().toLowerCase()
    // Lo mismo con el CI: el esquema lo recorta, así que se compara contra lo guardado recortado.
    const ciChanged = values.ci !== user.ci.trim()
    try {
      await mutateAsync({
        id: user.id,
        payload: {
          names: values.names,
          lastNames: values.lastNames,
          phone: values.phone ?? "",
          roleId: values.roleId,
          ...(emailChanged ? { email: values.email } : {}),
          ...(ciChanged ? { ci: values.ci } : {}),
        },
      })
      onClose()
    } catch {
      /* toast via interceptor */
    }
  })

  return (
    <Dialog open={Boolean(user)} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Editar usuario</DialogTitle>
          <DialogDescription>
            {user ? `${user.names} ${user.lastNames}` : ""}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} noValidate>
          <FieldGroup>
            <div className="grid grid-cols-2 gap-4">
              <Field data-invalid={Boolean(errors.names) || undefined}>
                <FieldLabel htmlFor="edit-names">Nombres</FieldLabel>
                <Input
                  id="edit-names"
                  aria-invalid={Boolean(errors.names) || undefined}
                  {...register("names")}
                />
                {errors.names ? (
                  <FieldError>{errors.names.message}</FieldError>
                ) : null}
              </Field>

              <Field data-invalid={Boolean(errors.lastNames) || undefined}>
                <FieldLabel htmlFor="edit-lastNames">Apellidos</FieldLabel>
                <Input
                  id="edit-lastNames"
                  aria-invalid={Boolean(errors.lastNames) || undefined}
                  {...register("lastNames")}
                />
                {errors.lastNames ? (
                  <FieldError>{errors.lastNames.message}</FieldError>
                ) : null}
              </Field>
            </div>

            <Field data-invalid={Boolean(errors.email) || undefined}>
              <FieldLabel htmlFor="edit-email">Correo</FieldLabel>
              <Input
                id="edit-email"
                type="email"
                autoComplete="off"
                aria-invalid={Boolean(errors.email) || undefined}
                {...register("email")}
              />
              {errors.email ? (
                <FieldError>{errors.email.message}</FieldError>
              ) : user?.mustChangePassword ? (
                <FieldDescription>
                  Todavía no inició sesión: si corriges el correo, le llegan
                  credenciales nuevas a la dirección corregida.
                </FieldDescription>
              ) : null}
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field data-invalid={Boolean(errors.ci) || undefined}>
                <FieldLabel htmlFor="edit-ci">CI</FieldLabel>
                <Input
                  id="edit-ci"
                  aria-invalid={Boolean(errors.ci) || undefined}
                  {...register("ci")}
                />
                {errors.ci ? (
                  <FieldError>{errors.ci.message}</FieldError>
                ) : null}
              </Field>

              <Field data-invalid={Boolean(errors.phone) || undefined}>
                <FieldLabel htmlFor="edit-phone">Teléfono</FieldLabel>
                <Input
                  id="edit-phone"
                  aria-invalid={Boolean(errors.phone) || undefined}
                  {...register("phone")}
                />
                {errors.phone ? (
                  <FieldError>{errors.phone.message}</FieldError>
                ) : null}
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Field data-invalid={Boolean(errors.roleId) || undefined}>
                <FieldLabel htmlFor="edit-roleId">Rol</FieldLabel>
                <Controller
                  control={control}
                  name="roleId"
                  render={({ field }) => (
                    <Select
                      value={field.value ? String(field.value) : ""}
                      onValueChange={(v) => field.onChange(Number(v))}
                    >
                      <SelectTrigger id="edit-roleId">
                        <SelectValue placeholder="Rol" />
                      </SelectTrigger>
                      <SelectContent>
                        {roleOptions.map((r) => (
                          <SelectItem key={r.id} value={String(r.id)}>
                            {r.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.roleId ? (
                  <FieldError>{errors.roleId.message}</FieldError>
                ) : null}
              </Field>
            </div>
          </FieldGroup>

          <DialogFooter className="mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isPending}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="bg-brand text-brand-foreground hover:bg-brand/90"
              disabled={isPending}
            >
              {isPending ? "Guardando…" : "Guardar cambios"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
