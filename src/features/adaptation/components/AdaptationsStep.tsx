import { useState } from "react"
import { PencilIcon, PlusIcon, Trash2Icon } from "lucide-react"

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
import { trimmed } from "@/lib/trimmed"

import type {
  Adaptation,
  CreateAdaptationPayload,
  UpdateAdaptationPayload,
} from "../types"

/** The four columns of the printed form, as the teacher is typing them. */
interface Columns {
  adaptedContents: string
  conditionType: string
  adaptedMethodology: string
  adaptedCriteria: string
}

const EMPTY_COLUMNS: Columns = {
  adaptedContents: "",
  conditionType: "",
  adaptedMethodology: "",
  adaptedCriteria: "",
}

function columnsOf(adaptation: Adaptation): Columns {
  return {
    adaptedContents: adaptation.adaptedContents ?? "",
    conditionType: adaptation.conditionType ?? "",
    adaptedMethodology: adaptation.adaptedMethodology ?? "",
    adaptedCriteria: adaptation.adaptedCriteria ?? "",
  }
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
  const columns: [string, string | null][] = [
    ["Contenido", adaptation.adaptedContents],
    ["Condición", adaptation.conditionType],
    ["Adaptación", adaptation.adaptedMethodology],
    ["Criterio", adaptation.adaptedCriteria],
  ]
  return columns.filter(
    (column): column is [string, string] =>
      column[1] !== null && column[1].trim() !== ""
  )
}

/**
 * The four boxes, shared by writing a row and correcting one. Only one of the two is ever on
 * screen, so the field ids stay the same in both.
 */
function ColumnFields({
  value,
  onChange,
}: {
  value: Columns
  onChange: (field: keyof Columns, next: string) => void
}) {
  const boxes = [
    ["adaptedContents", "Contenido"],
    ["conditionType", "Discapacidad/Talento extraordinario/TDH/TEA y otros"],
    ["adaptedMethodology", "Adaptación"],
    ["adaptedCriteria", "Criterio de evaluación"],
  ] as const

  return (
    <>
      {boxes.map(([field, label]) => (
        <Field key={field}>
          <FieldLabel htmlFor={`adaptation-${field}`}>{label}</FieldLabel>
          <Textarea
            id={`adaptation-${field}`}
            rows={2}
            value={value[field]}
            onChange={(e) => onChange(field, e.target.value)}
          />
        </Field>
      ))}
    </>
  )
}

export interface AdaptationsStepProps {
  planId: string
  /** The course's roster. Empty while it is being fetched. */
  students: CourseStudent[]
  adaptations: Adaptation[]
  saving: boolean
  onAdd: (payload: CreateAdaptationPayload) => void
  onUpdate: (change: { id: string; payload: UpdateAdaptationPayload }) => void
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
  onUpdate,
  onRemove,
  onBack,
  onNext,
}: AdaptationsStepProps) {
  const [studentId, setStudentId] = useState("")
  const [draft, setDraft] = useState<Columns>(EMPTY_COLUMNS)
  // The row being corrected, if any. Adding and editing never share the screen: two sets of the
  // same four labels would leave the teacher guessing which one the buttons act on.
  const [editing, setEditing] = useState<string | null>(null)

  const available = stillAvailable(students, adaptations)
  const change = (field: keyof Columns, next: string) =>
    setDraft((d) => ({ ...d, [field]: next }))

  const startEditing = (adaptation: Adaptation) => {
    setEditing(adaptation.id)
    setDraft(columnsOf(adaptation))
  }

  const stopEditing = () => {
    setEditing(null)
    setDraft(EMPTY_COLUMNS)
  }

  const add = () => {
    // A row without a student belongs to nobody, and the server refuses it. Nothing is sent until
    // the teacher says who it is for.
    if (studentId === "") return
    onAdd({
      id_curriculum_plan: planId,
      id_student: studentId,
      // An empty box on a new row is a column never written, which is a null rather than a blank.
      adaptedContents: trimmed(draft.adaptedContents),
      conditionType: trimmed(draft.conditionType),
      adaptedMethodology: trimmed(draft.adaptedMethodology),
      adaptedCriteria: trimmed(draft.adaptedCriteria),
    })
    setStudentId("")
    setDraft(EMPTY_COLUMNS)
  }

  const save = (id: string) => {
    onUpdate({
      id,
      // Emptied on purpose here, so the columns go as strings: the API reads a missing one as
      // "leave it", and a teacher who cleared a box would watch the old text come back.
      payload: {
        adaptedContents: draft.adaptedContents.trim(),
        conditionType: draft.conditionType.trim(),
        adaptedMethodology: draft.adaptedMethodology.trim(),
        adaptedCriteria: draft.adaptedCriteria.trim(),
      },
    })
    stopEditing()
  }

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-col gap-1">
        <h3 className="text-lg font-semibold">
          Adaptaciones curriculares significativas
        </h3>
        <p className="text-sm text-muted-foreground">
          Paso opcional. Se carga solo si en el curso hay un estudiante con
          discapacidad, talento extraordinario, TDH, TEA u otra condición.
        </p>
      </header>

      {adaptations.length > 0 ? (
        <ul className="flex flex-col gap-2">
          {adaptations.map((adaptation) => (
            <li key={adaptation.id} className="rounded-md border p-3 text-sm">
              {editing === adaptation.id ? (
                <div className="flex flex-col gap-4">
                  <p className="font-medium">
                    {adaptation.studentName ?? "Estudiante"}
                  </p>
                  <ColumnFields value={draft} onChange={change} />
                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={stopEditing}
                    >
                      Cancelar
                    </Button>
                    <Button
                      type="button"
                      disabled={saving}
                      onClick={() => save(adaptation.id)}
                    >
                      {saving ? "Guardando…" : "Guardar"}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 flex-col gap-1">
                    <p className="font-medium">
                      {adaptation.studentName ?? "Estudiante"}
                    </p>
                    {writtenColumns(adaptation).map(([label, value]) => (
                      <p key={label} className="text-muted-foreground">
                        <span className="font-medium">{label}: </span>
                        <span className="whitespace-pre-wrap">{value}</span>
                      </p>
                    ))}
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      disabled={saving}
                      onClick={() => startEditing(adaptation)}
                    >
                      <PencilIcon className="size-4" />
                      Editar
                    </Button>
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
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      ) : null}

      {editing !== null ? null : available.length === 0 ? (
        <p className="rounded-md border bg-muted/30 p-3 text-sm text-muted-foreground">
          {students.length === 0
            ? "Todavía no hay estudiantes inscritos en el curso."
            : "Todos los estudiantes del curso ya tienen su adaptación."}
        </p>
      ) : (
        <div className="flex flex-col gap-4 rounded-md border p-4">
          <Field>
            <FieldLabel htmlFor="adaptation-student">Estudiante</FieldLabel>
            <Select value={studentId} onValueChange={setStudentId}>
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

          <ColumnFields value={draft} onChange={change} />

          <div className="flex justify-end">
            <Button
              type="button"
              variant="outline"
              disabled={saving}
              onClick={add}
            >
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
          className="bg-brand text-brand-foreground hover:bg-brand/90"
          onClick={onNext}
        >
          Continuar
        </Button>
      </div>
    </div>
  )
}
