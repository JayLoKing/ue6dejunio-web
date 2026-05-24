import { useState } from "react"
import { useForm, Controller, type Resolver } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { PlusIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Field,
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
  createUserSchema,
  type CreateUserFormValues,
} from "../models/schemas/user-schemas"
import { useCreateUser } from "../hooks/useCreateUser"
import { ROLES } from "../types"

export function CreateUserDialog() {
  const [open, setOpen] = useState(false)
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<CreateUserFormValues>({
    resolver: zodResolver(createUserSchema) as Resolver<CreateUserFormValues>,
    defaultValues: {
      ci: "",
      names: "",
      lastNames: "",
      phone: "",
      email: "",
      roleId: undefined as unknown as number,
    },
  })

  const { mutateAsync, isPending } = useCreateUser()

  const onSubmit = handleSubmit(async (values) => {
    try {
      await mutateAsync({
        ci: values.ci,
        names: values.names,
        lastNames: values.lastNames,
        phone: values.phone ?? "",
        email: values.email,
        roleId: values.roleId,
      })
      reset()
      setOpen(false)
    } catch {
      /* toast via interceptor */
    }
  })

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (!next) reset()
      }}
    >
      <DialogTrigger asChild>
        <Button className="bg-univalle text-univalle-foreground hover:bg-univalle/90">
          <PlusIcon data-icon="inline-start" />
          Nuevo usuario
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Registrar usuario</DialogTitle>
          <DialogDescription>
            Crea cuentas para Director, Secretario o Docente.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} noValidate>
          <FieldGroup>
            <div className="grid grid-cols-2 gap-4">
              <Field data-invalid={Boolean(errors.ci) || undefined}>
                <FieldLabel htmlFor="ci">CI</FieldLabel>
                <Input
                  id="ci"
                  aria-invalid={Boolean(errors.ci) || undefined}
                  {...register("ci")}
                />
                {errors.ci ? <FieldError>{errors.ci.message}</FieldError> : null}
              </Field>

              <Field data-invalid={Boolean(errors.roleId) || undefined}>
                <FieldLabel htmlFor="roleId">Rol</FieldLabel>
                <Controller
                  control={control}
                  name="roleId"
                  render={({ field }) => (
                    <Select
                      value={field.value ? String(field.value) : undefined}
                      onValueChange={(v) => field.onChange(Number(v))}
                    >
                      <SelectTrigger
                        id="roleId"
                        aria-invalid={Boolean(errors.roleId) || undefined}
                      >
                        <SelectValue placeholder="Selecciona un rol" />
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

            <div className="grid grid-cols-2 gap-4">
              <Field data-invalid={Boolean(errors.names) || undefined}>
                <FieldLabel htmlFor="names">Nombres</FieldLabel>
                <Input
                  id="names"
                  aria-invalid={Boolean(errors.names) || undefined}
                  {...register("names")}
                />
                {errors.names ? (
                  <FieldError>{errors.names.message}</FieldError>
                ) : null}
              </Field>

              <Field data-invalid={Boolean(errors.lastNames) || undefined}>
                <FieldLabel htmlFor="lastNames">Apellidos</FieldLabel>
                <Input
                  id="lastNames"
                  aria-invalid={Boolean(errors.lastNames) || undefined}
                  {...register("lastNames")}
                />
                {errors.lastNames ? (
                  <FieldError>{errors.lastNames.message}</FieldError>
                ) : null}
              </Field>
            </div>

            <Field data-invalid={Boolean(errors.email) || undefined}>
              <FieldLabel htmlFor="email">Correo</FieldLabel>
              <Input
                id="email"
                type="email"
                aria-invalid={Boolean(errors.email) || undefined}
                {...register("email")}
              />
              {errors.email ? (
                <FieldError>{errors.email.message}</FieldError>
              ) : null}
            </Field>

            <Field data-invalid={Boolean(errors.phone) || undefined}>
              <FieldLabel htmlFor="phone">Telefono</FieldLabel>
              <Input
                id="phone"
                aria-invalid={Boolean(errors.phone) || undefined}
                {...register("phone")}
              />
              {errors.phone ? (
                <FieldError>{errors.phone.message}</FieldError>
              ) : null}
            </Field>
          </FieldGroup>

          <DialogFooter className="mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                reset()
                setOpen(false)
              }}
              disabled={isPending}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="bg-univalle text-univalle-foreground hover:bg-univalle/90"
              disabled={isPending}
            >
              {isPending ? "Creando..." : "Crear usuario"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
