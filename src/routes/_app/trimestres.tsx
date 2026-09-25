import { useMemo, useState } from "react"
import { createFileRoute, redirect } from "@tanstack/react-router"
import { Loader2Icon, SaveIcon, Trash2Icon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Field, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { ConfirmDialog } from "@/components/shared/ConfirmDialog"
import { useAuthStore } from "@/features/auth/store/authStore"
import { isRole } from "@/features/auth/types"
import { useAllCourses } from "@/features/courses/hooks/useCourses"
import {
  useCreateTrimesterPeriod,
  useDeleteTrimesterPeriod,
  useTrimesterPeriods,
  useUpdateTrimesterPeriod,
} from "@/features/academic/hooks/useAcademic"
import type { TrimesterPeriod } from "@/features/academic/types"

export const Route = createFileRoute("/_app/trimestres")({
  beforeLoad: () => {
    if (!isRole(useAuthStore.getState().role, "DIRECTOR")) {
      throw redirect({ to: "/dashboard" })
    }
  },
  component: TrimesterPeriodsPage,
})

/** The school year holds exactly three trimesters, so the ordinal table covers all of them. */
type Trimester = 1 | 2 | 3

const TRIMESTERS = [1, 2, 3] as const satisfies readonly Trimester[]

const ORDINAL: Record<Trimester, string> = { 1: "1er", 2: "2do", 3: "3er" }

function TrimesterPeriodsPage() {
  const coursesQuery = useAllCourses()
  // El año académico actual es el de cualquier curso (todos comparten el año).
  const academicYearId = coursesQuery.data?.content[0]?.academicYearId ?? null

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

      {coursesQuery.isLoading || periodsQuery.isLoading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2Icon className="size-4 animate-spin" /> Cargando…
        </div>
      ) : academicYearId === null ? (
        <div className="rounded-md border border-dashed p-12 text-center text-muted-foreground">
          No hay un año académico configurado. Crea un curso primero.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-3">
          {TRIMESTERS.map((t) => {
            const existing = byTrimester.get(t) ?? null
            return (
              // La key incluye el período que edita, así la tarjeta arranca de cero cuando se
              // crea o se borra uno. Espejar las fechas en un efecto reseteaba los campos en
              // cada refetch y borraba lo que el director había tecleado sin guardar.
              <TrimesterCard
                key={`${t}-${existing?.id ?? "new"}`}
                trimester={t}
                academicYearId={academicYearId}
                existing={existing}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}

interface TrimesterCardProps {
  trimester: Trimester
  academicYearId: number
  existing: TrimesterPeriod | null
}

function TrimesterCard({
  trimester,
  academicYearId,
  existing,
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
    if (!valid) return
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
          onChange={(e) => setStart(e.target.value)}
        />
      </Field>
      <Field>
        <FieldLabel htmlFor={`end-${trimester}`}>Fin</FieldLabel>
        <Input
          id={`end-${trimester}`}
          type="date"
          value={end}
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
          disabled={!valid || saving}
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
            disabled={remove.isPending}
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
