import { useState } from "react"
import { useIsMutating } from "@tanstack/react-query"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Field, FieldLabel } from "@/components/ui/field"
import { AcademicYearSelect } from "@/features/catalog/components/AcademicYearSelect"
import type { AcademicYearItem } from "@/features/catalog/types"

import { useDuplicateYearStructure } from "../hooks/useAcademicYearMutations"
import type { DuplicateStructureSummary } from "../types"
import { defaultSourceYear } from "../utils/yearActions"

export interface DuplicateStructureDialogProps {
  /** The open year that receives the copy; null keeps the dialog closed. */
  target: AcademicYearItem | null
  years: readonly AcademicYearItem[]
  onClose: () => void
}

export function DuplicateStructureDialog({
  target,
  years,
  onClose,
}: DuplicateStructureDialogProps) {
  return (
    <Dialog open={target !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        {/* Keyed by the target, so each opening starts from its own proposal and no summary. */}
        {target ? (
          <DuplicateStructureForm
            key={target.id}
            target={target}
            years={years}
            onClose={onClose}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  )
}

interface DuplicateStructureFormProps {
  target: AcademicYearItem
  years: readonly AcademicYearItem[]
  onClose: () => void
}

function DuplicateStructureForm({
  target,
  years,
  onClose,
}: DuplicateStructureFormProps) {
  const duplicate = useDuplicateYearStructure()
  const busy = useIsMutating() > 0
  const sources = years.filter((y) => y.id !== target.id)
  const [chosenId, setChosenId] = useState<number | null>(null)
  const [summary, setSummary] = useState<DuplicateStructureSummary | null>(null)

  // The proposal is derived, not copied into state by an effect: `chosenId` only records a choice.
  const sourceId = chosenId ?? defaultSourceYear(years, target)?.id ?? null

  const submit = () => {
    if (sourceId === null) return
    duplicate.mutate(
      { targetId: target.id, sourceId },
      { onSuccess: setSummary }
    )
  }

  if (summary) {
    return (
      <DuplicateSummary target={target} summary={summary} onClose={onClose} />
    )
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>Duplicar estructura en {target.year}</DialogTitle>
        <DialogDescription>
          Copia los cursos activos y sus materias, sin docentes ni docente de
          aula. Puedes repetirlo: los cursos que ya existen se saltan.
        </DialogDescription>
      </DialogHeader>

      {sources.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No hay otra gestión de la cual copiar.
        </p>
      ) : (
        <Field>
          <FieldLabel>Copiar desde</FieldLabel>
          <AcademicYearSelect
            years={sources}
            value={sourceId}
            onChange={setChosenId}
            className="w-full"
          />
        </Field>
      )}

      <DialogFooter>
        <Button variant="outline" disabled={busy} onClick={onClose}>
          Cancelar
        </Button>
        <Button disabled={busy || sourceId === null} onClick={submit}>
          {duplicate.isPending ? "Duplicando…" : "Duplicar"}
        </Button>
      </DialogFooter>
    </>
  )
}

function DuplicateSummary({
  target,
  summary,
  onClose,
}: {
  target: AcademicYearItem
  summary: DuplicateStructureSummary
  onClose: () => void
}) {
  return (
    <>
      <DialogHeader>
        <DialogTitle>Estructura duplicada en {target.year}</DialogTitle>
        <DialogDescription>
          Los cursos quedaron sin docentes. Asígnalos desde cada curso.
        </DialogDescription>
      </DialogHeader>

      <dl className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-1 text-sm">
        <SummaryLine label="Cursos creados" value={summary.coursesCreated} />
        <SummaryLine
          label="Materias abiertas"
          value={summary.classGroupsCreated}
        />
        <SummaryLine
          label="Cursos que ya existían"
          value={summary.coursesSkipped}
        />
      </dl>

      {summary.skippedCourses.length > 0 ? (
        <div className="flex flex-col gap-1 text-sm">
          <span className="text-muted-foreground">No se tocaron:</span>
          <ul className="list-disc pl-5">
            {summary.skippedCourses.map((name) => (
              <li key={name}>{name}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <DialogFooter>
        <Button onClick={onClose}>Cerrar</Button>
      </DialogFooter>
    </>
  )
}

function SummaryLine({ label, value }: { label: string; value: number }) {
  return (
    <>
      <dt className="text-muted-foreground">{label}:</dt>
      <dd className="font-medium">{value}</dd>
    </>
  )
}
