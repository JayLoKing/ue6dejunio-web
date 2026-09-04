import { SearchIcon } from "lucide-react"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  useAcademicYears,
  useGrades,
  useParallels,
} from "@/features/catalog/hooks/useCatalog"

import type { StudentDirectoryFilters, StudentDirectoryScope } from "../types"

/**
 * Radix no acepta un item con valor vacío, así que "sin elegir" necesita una palabra propia.
 * Nunca sale de este archivo: hacia afuera un filtro sin elegir sigue siendo `null`.
 */
const ANY = "any"

const SCOPE_LABEL: Record<StudentDirectoryScope, string> = {
  ACTIVE: "Activos",
  WITHDRAWN: "Dados de baja",
  ALL: "Todos",
}

export interface StudentDirectoryFiltersProps {
  value: StudentDirectoryFilters
  onChange: (next: StudentDirectoryFilters) => void
}

/**
 * Los filtros del directorio.
 *
 * La gestión no ofrece "todas" a propósito: el listado habla de un año a la vez, y juntarlos
 * mostraría al mismo estudiante una vez por año cursado. Mientras el catálogo carga, el selector
 * queda en "Gestión actual", que es exactamente lo que el backend responde sin el parámetro.
 */
export function StudentDirectoryFilters({
  value,
  onChange,
}: StudentDirectoryFiltersProps) {
  const grades = useGrades()
  const parallels = useParallels()
  const years = useAcademicYears()

  const set = <K extends keyof StudentDirectoryFilters>(
    key: K,
    next: StudentDirectoryFilters[K]
  ) => onChange({ ...value, [key]: next })

  const toId = (raw: string): number | null =>
    raw === ANY ? null : Number(raw)

  return (
    <div className="flex flex-col gap-4 md:flex-row md:flex-wrap md:items-end">
      <div className="flex min-w-0 flex-1 flex-col gap-1.5 md:max-w-sm">
        <Label htmlFor="directory-search">Buscar</Label>
        <div className="relative">
          <SearchIcon className="absolute top-1/2 left-2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="directory-search"
            placeholder="Nombre, apellido, RUDE o carnet…"
            value={value.q}
            onChange={(e) => set("q", e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="directory-year">Gestión</Label>
        <Select
          value={
            value.academicYearId === null ? ANY : String(value.academicYearId)
          }
          onValueChange={(v) => set("academicYearId", toId(v))}
        >
          <SelectTrigger id="directory-year" className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ANY}>Gestión actual</SelectItem>
            {(years.data ?? []).map((y) => (
              <SelectItem key={y.id} value={String(y.id)}>
                {y.year}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="directory-grade">Grado</Label>
        <Select
          value={value.gradeId === null ? ANY : String(value.gradeId)}
          onValueChange={(v) => set("gradeId", toId(v))}
        >
          <SelectTrigger id="directory-grade" className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ANY}>Todos los grados</SelectItem>
            {(grades.data ?? []).map((g) => (
              <SelectItem key={g.id} value={String(g.id)}>
                {g.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="directory-parallel">Paralelo</Label>
        <Select
          value={value.parallelId === null ? ANY : String(value.parallelId)}
          onValueChange={(v) => set("parallelId", toId(v))}
        >
          <SelectTrigger id="directory-parallel" className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ANY}>Todos</SelectItem>
            {(parallels.data ?? []).map((p) => (
              <SelectItem key={p.id} value={String(p.id)}>
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="directory-scope">Estado</Label>
        <Select
          value={value.scope}
          onValueChange={(v) => set("scope", v as StudentDirectoryScope)}
        >
          <SelectTrigger id="directory-scope" className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(
              Object.keys(SCOPE_LABEL) as StudentDirectoryScope[]
            ).map((s) => (
              <SelectItem key={s} value={s}>
                {SCOPE_LABEL[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
