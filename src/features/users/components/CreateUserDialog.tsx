import { useState } from "react"
import { useForm, useWatch, Controller } from "react-hook-form"
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
import { Checkbox } from "@/components/ui/checkbox"
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
import { ASSIGNABLE_ROLES, teachesSubjects } from "../types"

export function CreateUserDialog() {
  const [open, setOpen] = useState(false)
  const {
    register,
    handleSubmit,
    control,
    reset,
    setValue,
    formState: { errors },
  } = useForm<CreateUserFormValues>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      ci: "",
      names: "",
      lastNames: "",
      phone: "",
      email: "",
      technical: false,
      // Sin roleId: todavía no se eligió nada, y defaultValues es parcial, así que la forma
      // honesta de decir "sin valor" es omitirlo. Castear undefined a number solo le decía al
      // compilador que había un número donde no había ninguno.
    },
  })

  // useWatch y no watch(): watch devuelve una función nueva en cada render, y el compilador de
  // React deja de memoizar el componente entero antes que arriesgar una UI vieja.
  const roleId = useWatch({ control, name: "roleId" })
  const showsTechnical = teachesSubjects(roleId)

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
        technical: values.technical,
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
        <Button className="bg-brand text-brand-foreground hover:bg-brand/90">
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
                {errors.ci ? (
                  <FieldError>{errors.ci.message}</FieldError>
                ) : null}
              </Field>

              <Field data-invalid={Boolean(errors.roleId) || undefined}>
                <FieldLabel htmlFor="roleId">Rol</FieldLabel>
                <Controller
                  control={control}
                  name="roleId"
                  render={({ field }) => (
                    <Select
                      value={field.value ? String(field.value) : ""}
                      onValueChange={(v) => {
                        const roleId = Number(v)
                        field.onChange(roleId)
                        // La respuesta pertenecía al rol que la pidió: si el rol deja de enseñar,
                        // el campo queda escondido y mandaría un valor que nadie volvió a ver.
                        if (!teachesSubjects(roleId)) {
                          setValue("technical", false)
                        }
                      }}
                    >
                      <SelectTrigger
                        id="roleId"
                        aria-invalid={Boolean(errors.roleId) || undefined}
                      >
                        <SelectValue placeholder="Selecciona un rol" />
                      </SelectTrigger>
                      <SelectContent>
                        {ASSIGNABLE_ROLES.map((r) => (
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
              <FieldLabel htmlFor="phone">Teléfono</FieldLabel>
              <Input
                id="phone"
                aria-invalid={Boolean(errors.phone) || undefined}
                {...register("phone")}
              />
              {errors.phone ? (
                <FieldError>{errors.phone.message}</FieldError>
              ) : null}
            </Field>

            {showsTechnical ? (
              <Controller
                control={control}
                name="technical"
                render={({ field }) => (
                  <Field orientation="horizontal">
                    <Checkbox
                      id="technical"
                      checked={field.value}
                      onCheckedChange={(v) => field.onChange(Boolean(v))}
                    />
                    <FieldLabel htmlFor="technical" className="font-normal">
                      Docente técnico
                    </FieldLabel>
                  </Field>
                )}
              />
            ) : null}
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
              className="bg-brand text-brand-foreground hover:bg-brand/90"
              disabled={isPending}
            >
              {isPending ? "Creando…" : "Crear usuario"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
