import { useState } from "react"
import { PlusIcon, Trash2Icon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

import type { PdcEntryPayload, PdcSubject, UpsertPdcSubjectPayload } from "../types"
import { trimmed } from "../utils/trimmed"

/** A row while it is being typed: periods is text so an emptied box is not read as zero. */
interface DraftEntry {
  key: string
  weekLabel: string
  contents: string
  practice: string
  theory: string
  valuation: string
  production: string
  resources: string
  periods: string
  criteriaBeing: string
  criteriaKnowing: string
  criteriaDoing: string
}

let nextKey = 0
const newKey = () => `row-${nextKey++}`

function emptyRow(weekNumber: number): DraftEntry {
  return {
    key: newKey(),
    weekLabel: `Semana ${weekNumber}`,
    contents: "",
    practice: "",
    theory: "",
    valuation: "",
    production: "",
    resources: "",
    periods: "",
    criteriaBeing: "",
    criteriaKnowing: "",
    criteriaDoing: "",
  }
}

function toDraft(subject: PdcSubject): DraftEntry[] {
  if (subject.entries.length === 0) return [emptyRow(1)]
  return [...subject.entries]
    .sort((a, b) => a.displayOrder - b.displayOrder)
    .map((e) => ({
      key: newKey(),
      weekLabel: e.weekLabel,
      contents: e.contents ?? "",
      practice: e.practice ?? "",
      theory: e.theory ?? "",
      valuation: e.valuation ?? "",
      production: e.production ?? "",
      resources: e.resources ?? "",
      periods: e.periods === null ? "" : String(e.periods),
      criteriaBeing: e.criteriaBeing ?? "",
      criteriaKnowing: e.criteriaKnowing ?? "",
      criteriaDoing: e.criteriaDoing ?? "",
    }))
}

function toPayload(draft: DraftEntry[]): PdcEntryPayload[] {
  return draft
    // A row says which week it is or it is not a row: the API refuses one without a label, and
    // emptying the box is how the teacher removes a week they had added.
    .filter((r) => r.weekLabel.trim() !== "")
    .map((r) => ({
      weekLabel: r.weekLabel.trim(),
      contents: trimmed(r.contents),
      practice: trimmed(r.practice),
      theory: trimmed(r.theory),
      valuation: trimmed(r.valuation),
      production: trimmed(r.production),
      resources: trimmed(r.resources),
      periods: r.periods.trim() === "" ? undefined : Number(r.periods),
      criteriaBeing: trimmed(r.criteriaBeing),
      criteriaKnowing: trimmed(r.criteriaKnowing),
      criteriaDoing: trimmed(r.criteriaDoing),
    }))
}

export interface PdcSubjectStepProps {
  subject: PdcSubject
  saving: boolean
  onSave: (payload: UpsertPdcSubjectPayload) => void
  onBack: () => void
  backLabel: string
  nextLabel: string
}

/**
 * One subject's step. Mount it with `key={subject.id}` so moving to the next subject starts from
 * that subject's own saved state instead of carrying the previous one's typing across.
 */
export function PdcSubjectStep({
  subject,
  saving,
  onSave,
  onBack,
  backLabel,
  nextLabel,
}: PdcSubjectStepProps) {
  const [learningObjective, setLearningObjective] = useState(
    subject.learningObjective ?? "",
  )
  const [generalAdaptations, setGeneralAdaptations] = useState(
    subject.generalAdaptations ?? "",
  )
  const [rows, setRows] = useState<DraftEntry[]>(() => toDraft(subject))

  const patch = (key: string, field: keyof DraftEntry, value: string) =>
    setRows((prev) =>
      prev.map((r) => (r.key === key ? { ...r, [field]: value } : r)),
    )

  const submit = () =>
    onSave({
      learningObjective: trimmed(learningObjective),
      generalAdaptations: trimmed(generalAdaptations),
      entries: toPayload(rows),
    })

  return (
    <div className="flex min-w-0 flex-col gap-5">
      <header className="flex flex-col gap-1">
        <h3 className="text-lg font-semibold">{subject.subjectName}</h3>
        <p className="text-sm text-muted-foreground">
          {subject.knowledgeArea ?? "Sin área"}
          {subject.teacherName ? ` · ${subject.teacherName}` : ""}
        </p>
      </header>

      <Field>
        <FieldLabel htmlFor="pdc-learning-objective">
          Objetivo de aprendizaje
        </FieldLabel>
        <Textarea
          id="pdc-learning-objective"
          rows={3}
          value={learningObjective}
          onChange={(e) => setLearningObjective(e.target.value)}
        />
      </Field>

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h4 className="font-medium">Semanas</h4>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setRows((prev) => [...prev, emptyRow(prev.length + 1)])}
          >
            <PlusIcon className="size-4" /> Agregar semana
          </Button>
        </div>

        {rows.map((row, index) => (
          <div key={row.key} className="flex flex-col gap-3 rounded-md border p-4">
            <div className="flex items-end gap-3">
              <Field className="flex-1">
                <FieldLabel htmlFor={`week-${row.key}`}>Semana</FieldLabel>
                <Input
                  id={`week-${row.key}`}
                  value={row.weekLabel}
                  placeholder="Semana 1, o Semanas 3 y 4"
                  onChange={(e) => patch(row.key, "weekLabel", e.target.value)}
                />
              </Field>
              <Field className="w-28">
                <FieldLabel htmlFor={`periods-${row.key}`}>Periodos</FieldLabel>
                <Input
                  id={`periods-${row.key}`}
                  type="number"
                  min={0}
                  value={row.periods}
                  onChange={(e) => patch(row.key, "periods", e.target.value)}
                />
              </Field>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={`Quitar ${row.weekLabel || `fila ${index + 1}`}`}
                // The last row stays: a subject with no weeks has nothing to plan.
                disabled={rows.length === 1}
                onClick={() =>
                  setRows((prev) => prev.filter((r) => r.key !== row.key))
                }
              >
                <Trash2Icon className="size-4" />
              </Button>
            </div>

            <Field>
              <FieldLabel htmlFor={`contents-${row.key}`}>Contenidos</FieldLabel>
              <Textarea
                id={`contents-${row.key}`}
                rows={2}
                value={row.contents}
                onChange={(e) => patch(row.key, "contents", e.target.value)}
              />
            </Field>

            <div className="grid gap-3 md:grid-cols-2">
              {(
                [
                  ["practice", "PRÁCTICA"],
                  ["theory", "TEORÍA"],
                  ["valuation", "VALORACIÓN"],
                  ["production", "PRODUCCIÓN"],
                ] as const
              ).map(([field, label]) => (
                <Field key={field}>
                  <FieldLabel htmlFor={`${field}-${row.key}`}>{label}</FieldLabel>
                  <Textarea
                    id={`${field}-${row.key}`}
                    rows={2}
                    value={row[field]}
                    onChange={(e) => patch(row.key, field, e.target.value)}
                  />
                </Field>
              ))}
            </div>

            <Field>
              <FieldLabel htmlFor={`resources-${row.key}`}>Recursos</FieldLabel>
              <Textarea
                id={`resources-${row.key}`}
                rows={2}
                value={row.resources}
                onChange={(e) => patch(row.key, "resources", e.target.value)}
              />
            </Field>

            {/*
              The three the form evaluates on. Asking for a fourth would collect what the printed
              plan has no column for, and the teacher would never see it again.
            */}
            <div className="grid gap-3 md:grid-cols-2">
              {(
                [
                  ["criteriaBeing", "SER"],
                  ["criteriaKnowing", "SABER"],
                  ["criteriaDoing", "HACER"],
                ] as const
              ).map(([field, label]) => (
                <Field key={field}>
                  <FieldLabel htmlFor={`${field}-${row.key}`}>{label}</FieldLabel>
                  <Textarea
                    id={`${field}-${row.key}`}
                    rows={2}
                    value={row[field]}
                    onChange={(e) => patch(row.key, field, e.target.value)}
                  />
                </Field>
              ))}
            </div>
          </div>
        ))}
      </div>

      <Field>
        <FieldLabel htmlFor="pdc-general-adaptations">
          Adaptaciones curriculares
        </FieldLabel>
        {/*
          The wording the printed form carried between parentheses. It says who the row is for, so
          it belongs where the row gets written rather than on the document itself.
        */}
        <FieldDescription>
          Para estudiantes con dificultades en el aprendizaje (generales y específicas) o con ritmos
          de aprendizaje distintos.
        </FieldDescription>
        <Textarea
          id="pdc-general-adaptations"
          rows={4}
          value={generalAdaptations}
          onChange={(e) => setGeneralAdaptations(e.target.value)}
        />
      </Field>

      <div className="flex justify-between gap-3">
        <Button type="button" variant="outline" onClick={onBack}>
          {backLabel}
        </Button>
        <Button
          type="button"
          className="bg-univalle text-univalle-foreground hover:bg-univalle/90"
          disabled={saving}
          onClick={submit}
        >
          {saving ? "Guardando…" : nextLabel}
        </Button>
      </div>
    </div>
  )
}
