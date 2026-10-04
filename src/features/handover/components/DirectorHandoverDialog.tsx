import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { TriangleAlertIcon } from "lucide-react"

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
import { useAuthStore } from "@/features/auth/store/authStore"
import { roleLabel } from "@/lib/labels"

import { useLookupUser } from "../hooks/useLookupUser"
import { useStartHandover } from "../hooks/useStartHandover"
import {
  HANDOVER_CONFIRM_WORD,
  handoverEmailSchema,
  newDirectorSchema,
  type HandoverEmailFormValues,
  type NewDirectorFormValues,
} from "../models/schemas/handover-schemas"
import type { UserLookup } from "../models/response/handover-response"
import type { StartHandoverRequest } from "../models/requests/handover-request"
import { classifyLookup } from "../utils/classifyLookup"

export interface DirectorHandoverDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

/**
 * Lo que ya se sabe del reemplazante al llegar a la confirmación: el pedido listo para mandar y
 * cómo nombrarlo en pantalla.
 */
interface Pending {
  request: StartHandoverRequest
  label: string
}

type Step =
  | { name: "email" }
  | { name: "promote"; email: string; user: UserLookup }
  | { name: "details"; email: string }
  | { name: "confirm"; pending: Pending; back: Step }

/** La advertencia va al principio Y en el último paso: es lo que la persona no puede perderse. */
function AccessLossWarning() {
  return (
    <div
      className="flex gap-3 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm"
      role="note"
    >
      <TriangleAlertIcon className="mt-0.5 size-4 shrink-0 text-destructive" />
      <p>
        <span className="font-medium">Perderás el acceso.</span> En cuanto la
        persona nueva cambie su contraseña temporal, tu cuenta se dará de baja y
        se cerrará tu sesión. Hasta entonces sigues siendo Director.
      </p>
    </div>
  )
}

function EmailStep({
  onFound,
}: {
  onFound: (email: string, found: UserLookup | null) => void
}) {
  const ownEmail = useAuthStore((s) => s.email)
  const [blocked, setBlocked] = useState<string | null>(null)
  const lookup = useLookupUser()
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<HandoverEmailFormValues>({
    resolver: zodResolver(handoverEmailSchema),
    defaultValues: { email: "" },
  })

  const onSubmit = handleSubmit(async ({ email }) => {
    setBlocked(null)
    try {
      const found = await lookup.mutateAsync(email)
      const outcome = classifyLookup(email, ownEmail, found)
      if (outcome.kind === "blocked") {
        setBlocked(outcome.message)
        return
      }
      onFound(email, outcome.kind === "promote" ? outcome.user : null)
    } catch {
      /* toast via interceptor */
    }
  })

  return (
    <form onSubmit={onSubmit} noValidate>
      <FieldGroup>
        <Field data-invalid={Boolean(errors.email) || undefined}>
          <FieldLabel htmlFor="handover-email">
            Correo del nuevo Director
          </FieldLabel>
          <Input
            id="handover-email"
            type="email"
            aria-invalid={Boolean(errors.email) || undefined}
            {...register("email")}
          />
          {errors.email ? (
            <FieldError>{errors.email.message}</FieldError>
          ) : null}
          {blocked ? <FieldError>{blocked}</FieldError> : null}
          <FieldDescription>
            Si ya tiene cuenta, la ascendemos; si no, la creamos.
          </FieldDescription>
        </Field>
      </FieldGroup>
      <DialogFooter className="mt-6">
        <Button
          type="submit"
          className="bg-brand text-brand-foreground hover:bg-brand/90"
          disabled={lookup.isPending}
        >
          {lookup.isPending ? "Buscando…" : "Buscar"}
        </Button>
      </DialogFooter>
    </form>
  )
}

function PromoteStep({
  user,
  onBack,
  onContinue,
}: {
  user: UserLookup
  onBack: () => void
  onContinue: () => void
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1 rounded-md border bg-muted/30 p-3">
        <span className="font-semibold">{user.fullName}</span>
        <span className="text-sm text-muted-foreground">{user.email}</span>
        <Badge variant="secondary" className="w-fit">
          {roleLabel(user.role)}
        </Badge>
      </div>
      <p className="text-sm">
        Esta persona ya tiene cuenta. Si continúas, pasará a ser Director.
      </p>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onBack}>
          Atrás
        </Button>
        <Button
          type="button"
          className="bg-brand text-brand-foreground hover:bg-brand/90"
          onClick={onContinue}
        >
          Continuar
        </Button>
      </DialogFooter>
    </div>
  )
}

function DetailsStep({
  email,
  onBack,
  onContinue,
}: {
  email: string
  onBack: () => void
  onContinue: (values: NewDirectorFormValues) => void
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<NewDirectorFormValues>({
    resolver: zodResolver(newDirectorSchema),
    defaultValues: { ci: "", names: "", lastNames: "", phone: "" },
  })

  return (
    <form onSubmit={handleSubmit(onContinue)} noValidate>
      <p className="mb-4 text-sm text-muted-foreground">
        No hay una cuenta con <span className="font-medium">{email}</span>.
        Completa los datos para crearla.
      </p>
      <FieldGroup>
        <Field data-invalid={Boolean(errors.ci) || undefined}>
          <FieldLabel htmlFor="handover-ci">CI</FieldLabel>
          <Input
            id="handover-ci"
            aria-invalid={Boolean(errors.ci) || undefined}
            {...register("ci")}
          />
          {errors.ci ? <FieldError>{errors.ci.message}</FieldError> : null}
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field data-invalid={Boolean(errors.names) || undefined}>
            <FieldLabel htmlFor="handover-names">Nombres</FieldLabel>
            <Input
              id="handover-names"
              aria-invalid={Boolean(errors.names) || undefined}
              {...register("names")}
            />
            {errors.names ? (
              <FieldError>{errors.names.message}</FieldError>
            ) : null}
          </Field>
          <Field data-invalid={Boolean(errors.lastNames) || undefined}>
            <FieldLabel htmlFor="handover-last-names">Apellidos</FieldLabel>
            <Input
              id="handover-last-names"
              aria-invalid={Boolean(errors.lastNames) || undefined}
              {...register("lastNames")}
            />
            {errors.lastNames ? (
              <FieldError>{errors.lastNames.message}</FieldError>
            ) : null}
          </Field>
        </div>
        <Field data-invalid={Boolean(errors.phone) || undefined}>
          <FieldLabel htmlFor="handover-phone">Teléfono</FieldLabel>
          <Input
            id="handover-phone"
            aria-invalid={Boolean(errors.phone) || undefined}
            {...register("phone")}
          />
          {errors.phone ? (
            <FieldError>{errors.phone.message}</FieldError>
          ) : null}
        </Field>
      </FieldGroup>
      <DialogFooter className="mt-6">
        <Button type="button" variant="outline" onClick={onBack}>
          Atrás
        </Button>
        <Button
          type="submit"
          className="bg-brand text-brand-foreground hover:bg-brand/90"
        >
          Continuar
        </Button>
      </DialogFooter>
    </form>
  )
}

function ConfirmStep({
  pending,
  onBack,
  onDone,
}: {
  pending: Pending
  onBack: () => void
  onDone: () => void
}) {
  const [typed, setTyped] = useState("")
  const start = useStartHandover()
  const confirmed = typed.trim() === HANDOVER_CONFIRM_WORD

  const submit = async () => {
    if (!confirmed) return
    try {
      await start.mutateAsync(pending.request)
      onDone()
    } catch {
      /* toast via interceptor */
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <AccessLossWarning />
      <p className="text-sm">
        La dirección pasará a{" "}
        <span className="font-medium">{pending.label}</span>. Le enviaremos una
        contraseña temporal por correo.
      </p>
      <Field>
        <FieldLabel htmlFor="handover-confirm">
          {`Escribe ${HANDOVER_CONFIRM_WORD} para confirmar`}
        </FieldLabel>
        <Input
          id="handover-confirm"
          autoComplete="off"
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
        />
      </Field>
      <DialogFooter>
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          disabled={start.isPending}
        >
          Atrás
        </Button>
        <Button
          type="button"
          variant="destructive"
          disabled={!confirmed || start.isPending}
          onClick={() => void submit()}
        >
          {start.isPending ? "Transfiriendo…" : "Transferir la dirección"}
        </Button>
      </DialogFooter>
    </div>
  )
}

/**
 * El cambio de Director, en pasos: correo, (confirmar el ascenso | datos de la cuenta nueva) y una
 * confirmación escrita.
 *
 * El correo se busca ANTES de mandar nada porque el POST con un correo que ya existe ascendería a
 * esa persona en el momento. Y el último paso pide teclear una palabra, no apretar OK: lo que sigue
 * le quita el acceso a quien está mirando la pantalla, y un botón de aceptar se aprieta de reflejo.
 *
 * Los pasos viven dentro del contenido del diálogo, que se desmonta al cerrar: abrirlo de nuevo
 * empieza siempre por el correo, sin restos de un intento anterior.
 */
export function DirectorHandoverDialog({
  open,
  onOpenChange,
}: DirectorHandoverDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Cambio de Director</DialogTitle>
          <DialogDescription>
            Nombra a quien te va a reemplazar en la dirección.
          </DialogDescription>
        </DialogHeader>
        <HandoverFlow onClose={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  )
}

function HandoverFlow({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState<Step>({ name: "email" })

  return (
    <div className="flex flex-col gap-4">
      {step.name !== "confirm" ? <AccessLossWarning /> : null}

      {step.name === "email" ? (
        <EmailStep
          onFound={(email, found) =>
            setStep(
              found
                ? { name: "promote", email, user: found }
                : { name: "details", email }
            )
          }
        />
      ) : null}

      {step.name === "promote" ? (
        <PromoteStep
          user={step.user}
          onBack={() => setStep({ name: "email" })}
          onContinue={() =>
            setStep({
              name: "confirm",
              back: step,
              pending: {
                request: { email: step.email },
                label: `${step.user.fullName} (${step.email})`,
              },
            })
          }
        />
      ) : null}

      {step.name === "details" ? (
        <DetailsStep
          email={step.email}
          onBack={() => setStep({ name: "email" })}
          onContinue={(values) =>
            setStep({
              name: "confirm",
              back: step,
              pending: {
                request: {
                  email: step.email,
                  ci: values.ci,
                  names: values.names,
                  lastNames: values.lastNames,
                  phone: values.phone ?? "",
                },
                label: `${values.names} ${values.lastNames} (${step.email})`,
              },
            })
          }
        />
      ) : null}

      {step.name === "confirm" ? (
        <ConfirmStep
          pending={step.pending}
          onBack={() => setStep(step.back)}
          onDone={onClose}
        />
      ) : null}
    </div>
  )
}
