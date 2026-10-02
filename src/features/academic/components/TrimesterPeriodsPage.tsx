import { useMemo, useState } from "react"
import { Loader2Icon, SaveIcon, Trash2Icon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Field, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ConfirmDialog } from "@/components/shared/ConfirmDialog"
import { useAcademicYears } from "@/features/catalog/hooks/useCatalog"
import { activeAcademicYear } from "@/features/catalog/utils/activeAcademicYear"
import type { AcademicYearItem } from "@/features/catalog/types"
import {
  useCreateTrimesterPeriod,
  useDeleteTrimesterPeriod,
  useTrimesterPeriods,
  useUpdateTrimesterPeriod,
} from "../hooks/useAcademic"
import type { TrimesterPeriod } from "../types"

/** The school year holds exactly three trimesters, so the ordinal table covers all of them. */
type Trimester = 1 | 2 | 3

const TRIMESTERS = [1, 2, 3] as const satisfies readonly Trimester[]

const ORDINAL: Record<Trimester, string> = { 1: "1er", 2: "2do", 3: "3er" }

const yearLabel = (year: AcademicYearItem): string =>
  `Gestión ${year.year}${year.closed ? " (cerrada)" : ""}`

export function TrimesterPeriodsPage() {
  const yearsQuery = useAcademicYears()
  const years = yearsQuery.data ?? []
  const [chosenYearId, setChosenYearId] = useState<number | null>(null)

  // La gestión activa mientras nadie eligió, derivada y no sincronizada en un efecto. Sin activa
  // no hay caída a la primera de la lista: el Director elige o activa una en Gestiones.
  const academicYearId =
    chosenYearId ?? activeAcademicYear(yearsQuery.data)?.id ?? null
  const selectedYear = years.find((y) => y.id === academicYearId)
  const closed = selectedYear?.closed ?? false

  const periodsQuery = useTrimesterPeriods(academicYearId)

  const byTrimester = useMemo(() => {
    const m = new Map<number, TrimesterPeriod>()
    for (const p of periodsQuery.data ?? []) m.set(p.trimester, p)
    return m
  }, [periodsQuery.data])

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">Trimestres</h1>
        <p className="text-sm text-muted-foreground">
          Configura las fechas de inicio y fin de cada trimestre del año
          académico.
        </p>
      </div>

      {yearsQuery.isLoading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2Icon className="size-4 animate-spin" /> Cargando…
        </div>
      ) : yearsQuery.isError ? (
        <div
          role="alert"
          className="rounded-md border border-dashed p-12 text-center text-destructive"
        >
          No se pudieron cargar las gestiones. Intenta de nuevo.
        </div>
      ) : (
        <>
          <Select
            value={academicYearId === null ? "" : String(academicYearId)}
            onValueChange={(v) => setChosenYearId(Number(v))}
          >
            <SelectTrigger className="w-56" aria-label="Gestión">
              <SelectValue placeholder="Elige una gestión" />
            </SelectTrigger>
            <SelectContent>
              {years.map((y) => (
                <SelectItem key={y.id} value={String(y.id)}>
                  {yearLabel(y)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {academicYearId === null ? (
            <div className="rounded-md border border-dashed p-12 text-center text-muted-foreground">
              No hay una gestión activa. Actívala en Gestiones o elige una.
            </div>
          ) : periodsQuery.isLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2Icon className="size-4 animate-spin" /> Cargando…
            </div>
          ) : (
            <>
              {closed ? (
                <p className="text-sm text-muted-foreground">
                  La gestión está cerrada; reábrela en Gestiones para editar sus
                  trimestres.
                </p>
              ) : null}
              <div className="grid gap-4 md:grid-cols-3">
                {TRIMESTERS.map((t) => {
                  const existing = byTrimester.get(t) ?? null
                  return (
                    // La key incluye el período que edita, así la tarjeta arranca de cero cuando se
                    // crea o se borra uno, y la gestión, así cambiar de año también la reinicia.
                    // Espejar las fechas en un efecto reseteaba los campos en cada refetch y
                    // borraba lo que el director había tecleado sin guardar.
                    <TrimesterCard
                      key={`${academicYearId}-${t}-${existing?.id ?? "new"}`}
                      trimester={t}
                      academicYearId={academicYearId}
                      existing={existing}
                      readOnly={closed}
                    />
                  )
                })}
              </div>
            </>
          )}
        </>
      )}
    </div>
  )
}

interface TrimesterCardProps {
  trimester: Trimester
  academicYearId: number
  existing: TrimesterPeriod | null
  /** Gestión cerrada: la API respondería 409, así que ni se ofrece editar. */
  readOnly: boolean
}

function TrimesterCard({
  trimester,
  academicYearId,
  existing,
  readOnly,
}: TrimesterCardProps) {
  const [start, setStart] = useState(existing?.startDate ?? "")
  const [end, setEnd] = useState(existing?.endDate ?? "")
  const [confirmDelete, setConfirmDelete] = useState(false)

  const create = useCreateTrimesterPeriod()
  const update = useUpdateTrimesterPeriod()
  const remove = useDeleteTrimesterPeriod()

  const saving = create.isPending || update.isPending
  const valid = start !== "" && end !== "" && start <= end

  const save = () => {
    if (readOnly || !valid) return
    if (existing) {
      update.mutate({
        id: existing.id,
        payload: { start_date: start, end_date: end },
      })
    } else {
      create.mutate({
        id_academic_year: academicYearId,
        trimester,
        start_date: start,
        end_date: end,
      })
    }
  }

  return (
    <div className="flex flex-col gap-3 rounded-md border p-4">
      <div className="flex items-center justify-between">
        <span className="font-semibold">{ORDINAL[trimester]} trimestre</span>
        {existing ? (
          <span className="rounded bg-success/12 px-2 py-0.5 text-[11px] text-success">
            Configurado
          </span>
        ) : (
          <span className="rounded bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
            Sin configurar
          </span>
        )}
      </div>

      <Field>
        <FieldLabel htmlFor={`start-${trimester}`}>Inicio</FieldLabel>
        <Input
          id={`start-${trimester}`}
          type="date"
          value={start}
          disabled={readOnly}
          onChange={(e) => setStart(e.target.value)}
        />
      </Field>
      <Field>
        <FieldLabel htmlFor={`end-${trimester}`}>Fin</FieldLabel>
        <Input
          id={`end-${trimester}`}
          type="date"
          value={end}
          disabled={readOnly}
          onChange={(e) => setEnd(e.target.value)}
        />
      </Field>
      {start !== "" && end !== "" && start > end ? (
        <p className="text-xs text-destructive">
          El inicio no puede ser posterior al fin.
        </p>
      ) : null}

      <div className="flex items-center gap-2">
        <Button
          size="sm"
          className="bg-brand text-brand-foreground hover:bg-brand/90"
          disabled={readOnly || !valid || saving}
          onClick={save}
        >
          <SaveIcon data-icon="inline-start" />
          {saving ? "Guardando…" : existing ? "Actualizar" : "Configurar"}
        </Button>
        {existing ? (
          <Button
            size="sm"
            variant="ghost"
            className="text-destructive"
            aria-label={`Eliminar ${ORDINAL[trimester]} trimestre`}
            disabled={readOnly || remove.isPending}
            onClick={() => setConfirmDelete(true)}
          >
            <Trash2Icon className="size-4" />
          </Button>
        ) : null}
      </div>

      <ConfirmDialog
        open={confirmDelete}
        title="Eliminar trimestre"
        description={`Se eliminará la configuración del ${ORDINAL[trimester]} trimestre.`}
        confirmLabel="Eliminar"
        destructive
        loading={remove.isPending}
        onConfirm={() => {
          if (!existing) return
          remove.mutate(existing.id, {
            onSuccess: () => setConfirmDelete(false),
          })
        }}
        onOpenChange={(o) => !o && setConfirmDelete(false)}
      />
    </div>
  )
}
