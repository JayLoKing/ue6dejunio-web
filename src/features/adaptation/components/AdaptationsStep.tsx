import { useState } from "react"
import { PlusIcon, Trash2Icon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { CourseStudent } from "@/features/courses/types/course"
import { trimmed } from "@/features/pdc/utils/trimmed"

import type { Adaptation, CreateAdaptationPayload } from "../types"

/** The columns of the printed form, and what an emptied box means: nothing written, not "". */
interface Draft {
  studentId: string
  adaptedContents: string
  conditionType: string
  adaptedMethodology: string
  adaptedCriteria: string
}

const EMPTY: Draft = {
  studentId: "",
  adaptedContents: "",
  conditionType: "",
  adaptedMethodology: "",
  adaptedCriteria: "",
}

/**
 * The students still available. The server keeps one adaptation per plan and student, so a name
 * already written is not offered again — choosing it would answer with a 409 the teacher did
 * nothing to earn.
 */
function stillAvailable(students: CourseStudent[], adaptations: Adaptation[]) {
  const taken = new Set(adaptations.map((a) => a.studentId))
  return students.filter((s) => !taken.has(s.studentId))
}

/** What the printed row says, in the template's own order, skipping the columns left empty. */
function writtenColumns(adaptation: Adaptation) {
  return [
    ["Contenido", adaptation.adaptedContents],
    ["Condición", adaptation.conditionType],
    ["Adaptación", adaptation.adaptedMethodology],
    ["Criterio", adaptation.adaptedCriteria],
  ].filter(([, value]) => value && value.trim() !== "") as [string, string][]
}

export interface AdaptationsStepProps {
  planId: string
  /** The course's roster. Empty while it is being fetched. */
  students: CourseStudent[]
  adaptations: Adaptation[]
  saving: boolean
  onAdd: (payload: CreateAdaptationPayload) => void
  onRemove: (id: string) => void
  onBack: () => void
  onNext: () => void
}

/**
 * The significant adaptations of the month, one row per student who needs one. The step is optional
 * by design: most months have none, and a teacher with nothing to write here has to be able to walk
 * past it rather than look for something to fill in.
 */
export function AdaptationsStep({
  planId,
  students,
  adaptations,
  saving,
  onAdd,
  onRemove,
  onBack,
  onNext,
}: AdaptationsStepProps) {
  const [draft, setDraft] = useState<Draft>(EMPTY)
  const available = stillAvailable(students, adaptations)
  const set = (field: keyof Draft) => (value: string) =>
    setDraft((d) => ({ ...d, [field]: value }))

  const add = () => {
    // A row without a student belongs to nobody, and the server refuses it. Nothing is sent until
    // the teacher says who it is for.
    if (draft.studentId === "") return
    onAdd({
      id_curriculum_plan: planId,
      id_student: draft.studentId,
      adaptedContents: trimmed(draft.adaptedContents),
      conditionType: trimmed(draft.conditionType),
      adaptedMethodology: trimmed(draft.adaptedMethodology),
      adaptedCriteria: trimmed(draft.adaptedCriteria),
    })
    setDraft(EMPTY)
  }

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-col gap-1">
        <h3 className="text-lg font-semibold">Adaptaciones curriculares significativas</h3>
        <p className="text-sm text-muted-foreground">
          Paso opcional. Se carga solo si en el curso hay un estudiante con
          discapacidad, talento extraordinario, TDH, TEA u otra condición.
        </p>
      </header>

      {adaptations.length > 0 ? (
        <ul className="flex flex-col gap-2">
          {adaptations.map((adaptation) => (
            <li
              key={adaptation.id}
              className="flex items-start justify-between gap-3 rounded-md border p-3 text-sm"
            >
              <div className="flex min-w-0 flex-col gap-1">
                <p className="font-medium">{adaptation.studentName ?? "Estudiante"}</p>
                {writtenColumns(adaptation).map(([label, value]) => (
                  <p key={label} className="text-muted-foreground">
                    <span className="font-medium">{label}: </span>
                    <span className="whitespace-pre-wrap">{value}</span>
                  </p>
                ))}
              </div>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                disabled={saving}
                onClick={() => onRemove(adaptation.id)}
              >
                <Trash2Icon className="size-4" />
                Quitar
              </Button>
            </li>
          ))}
        </ul>
      ) : null}

      {available.length === 0 ? (
        <p className="rounded-md border bg-muted/30 p-3 text-sm text-muted-foreground">
          {students.length === 0
            ? "Todavía no hay estudiantes inscritos en el curso."
            : "Todos los estudiantes del curso ya tienen su adaptación."}
        </p>
      ) : (
        <div className="flex flex-col gap-4 rounded-md border p-4">
          <Field>
            <FieldLabel htmlFor="adaptation-student">Estudiante</FieldLabel>
            <Select value={draft.studentId} onValueChange={set("studentId")}>
              <SelectTrigger id="adaptation-student">
                <SelectValue placeholder="Selecciona al estudiante" />
              </SelectTrigger>
              <SelectContent>
                {available.map((student) => (
                  <SelectItem key={student.studentId} value={student.studentId}>
                    {student.fullName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FieldDescription>
              Cada estudiante lleva una sola fila en el plan del mes.
            </FieldDescription>
          </Field>

          <Field>
            <FieldLabel htmlFor="adaptation-contents">Contenido</FieldLabel>
            <Textarea
              id="adaptation-contents"
              rows={2}
              value={draft.adaptedContents}
              onChange={(e) => set("adaptedContents")(e.target.value)}
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="adaptation-condition">
              Discapacidad/Talento extraordinario/TDH/TEA y otros
            </FieldLabel>
            <Textarea
              id="adaptation-condition"
              rows={2}
              value={draft.conditionType}
              onChange={(e) => set("conditionType")(e.target.value)}
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="adaptation-methodology">Adaptación</FieldLabel>
            <Textarea
              id="adaptation-methodology"
              rows={2}
              value={draft.adaptedMethodology}
              onChange={(e) => set("adaptedMethodology")(e.target.value)}
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="adaptation-criteria">Criterio de evaluación</FieldLabel>
            <Textarea
              id="adaptation-criteria"
              rows={2}
              value={draft.adaptedCriteria}
              onChange={(e) => set("adaptedCriteria")(e.target.value)}
            />
          </Field>

          <div className="flex justify-end">
            <Button type="button" variant="outline" disabled={saving} onClick={add}>
              <PlusIcon className="size-4" />
              {saving ? "Guardando…" : "Agregar adaptación"}
            </Button>
          </div>
        </div>
      )}

      <div className="flex justify-between gap-3">
        <Button type="button" variant="outline" onClick={onBack}>
          Anterior
        </Button>
        <Button
          type="button"
          className="bg-univalle text-univalle-foreground hover:bg-univalle/90"
          onClick={onNext}
        >
          Continuar
        </Button>
      </div>
    </div>
  )
}
