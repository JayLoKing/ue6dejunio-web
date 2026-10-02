import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import type { AcademicYearItem } from "../types"

const yearLabel = (year: AcademicYearItem): string =>
  `Gestión ${year.year}${year.closed ? " (cerrada)" : ""}`

export interface AcademicYearSelectProps {
  years: readonly AcademicYearItem[]
  /** La gestión elegida, o null si no hay ninguna: "" y no `undefined`, para que Radix la suelte. */
  value: number | null
  onChange: (academicYearId: number) => void
  className?: string
}

/** El selector de gestión de toda pantalla que se acota a una: una sola etiqueta, un solo aspecto. */
export function AcademicYearSelect({
  years,
  value,
  onChange,
  className = "w-56",
}: AcademicYearSelectProps) {
  return (
    <Select
      value={value === null ? "" : String(value)}
      onValueChange={(v) => onChange(Number(v))}
    >
      <SelectTrigger className={className} aria-label="Gestión">
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
  )
}
