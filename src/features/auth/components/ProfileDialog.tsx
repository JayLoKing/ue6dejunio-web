import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2Icon } from "lucide-react"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
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
import { roleLabel } from "@/lib/labels"

import { useProfile } from "../hooks/useProfile"
import { useUpdateProfile } from "../hooks/useUpdateProfile"
import {
  profileSchema,
  type ProfileFormValues,
} from "../models/schemas/credentials-schema"
import type { ProfileResponse } from "../models/response/credential-response"
import { useAuthStore } from "../store/authStore"

export interface ProfileDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

/**
 * El formulario vive aparte del diálogo para que sus valores iniciales sean los del perfil ya
 * cargado: montarlo después de la carga evita un `reset` en un efecto, y volver a abrir el diálogo
 * lo monta de nuevo con lo guardado.
 */
function ProfileForm({
  profile,
  onDone,
}: {
  profile: ProfileResponse
  onDone: () => void
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      names: profile.names,
      lastNames: profile.lastNames,
      phone: profile.phone ?? "",
    },
  })
  const { mutateAsync, isPending } = useUpdateProfile()

  const onSubmit = handleSubmit(async (values) => {
    try {
      await mutateAsync({
        names: values.names,
        lastNames: values.lastNames,
        phone: values.phone ?? "",
      })
      onDone()
    } catch {
      /* toast via interceptor */
    }
  })

  return (
    <form onSubmit={onSubmit} noValidate>
      <FieldGroup>
        <div className="grid grid-cols-2 gap-4">
          <Field>
            <FieldLabel htmlFor="profile-ci">CI</FieldLabel>
            <Input
              id="profile-ci"
              readOnly
              value={profile.ci}
              className="bg-muted/40"
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="profile-email">Correo</FieldLabel>
            <Input
              id="profile-email"
              readOnly
              value={profile.email}
              className="bg-muted/40"
            />
          </Field>
        </div>
        <FieldDescription>
          El CI y el correo los administra la dirección de la escuela.
        </FieldDescription>

        <div className="grid grid-cols-2 gap-4">
          <Field data-invalid={Boolean(errors.names) || undefined}>
            <FieldLabel htmlFor="profile-names">Nombres</FieldLabel>
            <Input
              id="profile-names"
              aria-invalid={Boolean(errors.names) || undefined}
              {...register("names")}
            />
            {errors.names ? (
              <FieldError>{errors.names.message}</FieldError>
            ) : null}
          </Field>
          <Field data-invalid={Boolean(errors.lastNames) || undefined}>
            <FieldLabel htmlFor="profile-last-names">Apellidos</FieldLabel>
            <Input
              id="profile-last-names"
              aria-invalid={Boolean(errors.lastNames) || undefined}
              {...register("lastNames")}
            />
            {errors.lastNames ? (
              <FieldError>{errors.lastNames.message}</FieldError>
            ) : null}
          </Field>
        </div>

        <Field data-invalid={Boolean(errors.phone) || undefined}>
          <FieldLabel htmlFor="profile-phone">Teléfono</FieldLabel>
          <Input
            id="profile-phone"
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
          onClick={onDone}
          disabled={isPending}
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          className="bg-brand text-brand-foreground hover:bg-brand/90"
          disabled={isPending}
        >
          {isPending ? "Guardando…" : "Guardar"}
        </Button>
      </DialogFooter>
    </form>
  )
}

export function ProfileDialog({ open, onOpenChange }: ProfileDialogProps) {
  const { data: profile, isLoading, isError } = useProfile(open)
  const fullName = useAuthStore((s) => s.fullName)
  const role = useAuthStore((s) => s.role)
  const gradeName = useAuthStore((s) => s.gradeName)
  const parallelName = useAuthStore((s) => s.parallelName)

  const displayName = fullName?.trim() || "Usuario"

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Mi perfil</DialogTitle>
          <DialogDescription>
            Corrige tus nombres, apellidos y teléfono.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-3">
          <Avatar className="size-12">
            <AvatarFallback className="bg-brand text-brand-foreground">
              {displayName.slice(0, 1).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="font-semibold">{displayName}</span>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="w-fit">
                {roleLabel(role) || "Sin rol"}
              </Badge>
              {gradeName ? (
                <span className="text-xs text-muted-foreground">
                  {`${gradeName}${parallelName ? ` "${parallelName}"` : ""}`}
                </span>
              ) : null}
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
            <Loader2Icon className="size-4 animate-spin" />
            Cargando…
          </div>
        ) : isError || !profile ? (
          <div className="rounded-md border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
            No se pudo cargar el perfil.
          </div>
        ) : (
          <ProfileForm profile={profile} onDone={() => onOpenChange(false)} />
        )}
      </DialogContent>
    </Dialog>
  )
}
