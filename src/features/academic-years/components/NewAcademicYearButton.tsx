import { useState } from "react"
import { useIsMutating } from "@tanstack/react-query"
import { PlusIcon } from "lucide-react"

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
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { useAcademicYears } from "@/features/catalog/hooks/useCatalog"

import { useCreateAcademicYear } from "../hooks/useAcademicYearMutations"
import {
  MAX_YEAR,
  MIN_YEAR,
  suggestNextYear,
  yearInputError,
} from "../utils/newYear"

/** "Nueva gestión": opens the dialog that creates a year (inactive and open) from the page header. */
export function NewAcademicYearButton() {
  const years = useAcademicYears()
  const busy = useIsMutating() > 0
  const [open, setOpen] = useState(false)

  return (
    <>
      {/* Not before the list is known: the proposed year is derived from it. */}
      <Button disabled={busy || years.isPending} onClick={() => setOpen(true)}>
        <PlusIcon data-icon="inline-start" />
        Nueva gestión
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-sm">
          {/* Mounted per opening, so the field starts from the proposal each time. */}
          {open ? (
            <NewYearForm
              initialYear={suggestNextYear(years.data)}
              onClose={() => setOpen(false)}
            />
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  )
}

function NewYearForm({
  initialYear,
  onClose,
}: {
  initialYear: number
  onClose: () => void
}) {
  const create = useCreateAcademicYear()
  const busy = useIsMutating() > 0
  const [text, setText] = useState(String(initialYear))

  const error = yearInputError(text)

  const submit = () => {
    if (error) return
    create.mutate(Number(text.trim()), { onSuccess: onClose })
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>Nueva gestión</DialogTitle>
        <DialogDescription>
          La gestión se crea abierta y sin activar. Si ya existe, no se duplica.
        </DialogDescription>
      </DialogHeader>

      <Field data-invalid={error ? true : undefined}>
        <FieldLabel htmlFor="new-year">Año</FieldLabel>
        <Input
          id="new-year"
          type="number"
          inputMode="numeric"
          min={MIN_YEAR}
          max={MAX_YEAR}
          value={text}
          aria-invalid={error ? true : undefined}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
        />
        {error ? (
          <FieldError>{error}</FieldError>
        ) : (
          <FieldDescription>
            Entre {MIN_YEAR} y {MAX_YEAR}.
          </FieldDescription>
        )}
      </Field>

      <DialogFooter>
        <Button variant="outline" disabled={busy} onClick={onClose}>
          Cancelar
        </Button>
        <Button disabled={busy || error !== null} onClick={submit}>
          {create.isPending ? "Creando…" : "Crear gestión"}
        </Button>
      </DialogFooter>
    </>
  )
}
