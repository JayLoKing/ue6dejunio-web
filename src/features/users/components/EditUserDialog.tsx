import { useEffect } from "react"
import { useForm, Controller, type Resolver } from "react-hook-form"
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
import { ROLES } from "../types"
import type { UsersListItem } from "../models/response/user-response"

export interface EditUserDialogProps {
  user: UsersListItem | null
  onClose: () => void
}

const roleIdFromName = (role: string): number =>
  ROLES.find((r) => r.name === role.toUpperCase())?.id ?? 3

export function EditUserDialog({ user, onClose }: EditUserDialogProps) {
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<UpdateUserFormValues>({
    resolver: zodResolver(updateUserSchema) as Resolver<UpdateUserFormValues>,
    defaultValues: {
      names: "",
      lastNames: "",
      phone: "",
      roleId: 3,
      active: true,
    },
  })

  const { mutateAsync, isPending } = useUpdateUser()

  useEffect(() => {
    if (user) {
      reset({
        names: user.names,
        lastNames: user.lastNames,
        phone: user.phone ?? "",
        roleId: roleIdFromName(user.role),
        active: user.active,
      })
    }
  }, [user, reset])

  const onSubmit = handleSubmit(async (values) => {
    if (!user) return
    try {
      await mutateAsync({
        id: user.id,
        payload: {
          names: values.names,
          lastNames: values.lastNames,
          phone: values.phone ?? "",
          roleId: values.roleId,
          active: values.active,
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
            {user ? `${user.ci} · ${user.email}` : ""}
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

            <div className="grid grid-cols-2 gap-4">
              <Field data-invalid={Boolean(errors.phone) || undefined}>
                <FieldLabel htmlFor="edit-phone">Telefono</FieldLabel>
                <Input
                  id="edit-phone"
                  aria-invalid={Boolean(errors.phone) || undefined}
                  {...register("phone")}
                />
                {errors.phone ? (
                  <FieldError>{errors.phone.message}</FieldError>
                ) : null}
              </Field>

              <Field data-invalid={Boolean(errors.roleId) || undefined}>
                <FieldLabel htmlFor="edit-roleId">Rol</FieldLabel>
                <Controller
                  control={control}
                  name="roleId"
                  render={({ field }) => (
                    <Select
                      value={field.value ? String(field.value) : undefined}
                      onValueChange={(v) => field.onChange(Number(v))}
                    >
                      <SelectTrigger id="edit-roleId">
                        <SelectValue placeholder="Rol" />
                      </SelectTrigger>
                      <SelectContent>
                        {ROLES.map((r) => (
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

            <Controller
              control={control}
              name="active"
              render={({ field }) => (
                <Field>
                  <FieldLabel htmlFor="edit-active">Estado</FieldLabel>
                  <Select
                    value={field.value ? "true" : "false"}
                    onValueChange={(v) => field.onChange(v === "true")}
                  >
                    <SelectTrigger id="edit-active">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">Activo</SelectItem>
                      <SelectItem value="false">Inactivo</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
              )}
            />
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
              className="bg-univalle text-univalle-foreground hover:bg-univalle/90"
              disabled={isPending}
            >
              {isPending ? "Guardando..." : "Guardar cambios"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
