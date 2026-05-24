import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Field, FieldLabel } from "@/components/ui/field"
import { useGrades, useParallels } from "@/features/catalog/hooks/useCatalog"

export interface GradeParallelPickerProps {
  gradeId: number | undefined
  parallelId: number | undefined
  onChange: (next: { gradeId?: number; parallelId?: number }) => void
  disabled?: boolean
}

export function GradeParallelPicker({
  gradeId,
  parallelId,
  onChange,
  disabled,
}: GradeParallelPickerProps) {
  const grades = useGrades()
  const parallels = useParallels()

  return (
    <div className="grid grid-cols-2 gap-4">
      <Field>
        <FieldLabel htmlFor="grade">Grado</FieldLabel>
        <Select
          value={gradeId ? String(gradeId) : undefined}
          onValueChange={(v) => onChange({ gradeId: Number(v), parallelId })}
          disabled={disabled || grades.isLoading}
        >
          <SelectTrigger id="grade">
            <SelectValue placeholder="Selecciona grado" />
          </SelectTrigger>
          <SelectContent>
            {(grades.data ?? []).map((g) => (
              <SelectItem key={g.id} value={String(g.id)}>
                {g.name} — {g.level}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>

      <Field>
        <FieldLabel htmlFor="parallel">Paralelo</FieldLabel>
        <Select
          value={parallelId ? String(parallelId) : undefined}
          onValueChange={(v) => onChange({ gradeId, parallelId: Number(v) })}
          disabled={disabled || parallels.isLoading}
        >
          <SelectTrigger id="parallel">
            <SelectValue placeholder="Selecciona paralelo" />
          </SelectTrigger>
          <SelectContent>
            {(parallels.data ?? []).map((p) => (
              <SelectItem key={p.id} value={String(p.id)}>
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
    </div>
  )
}
