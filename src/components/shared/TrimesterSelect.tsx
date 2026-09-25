import { CalendarDays } from "lucide-react"
import { useMemo } from "react"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { useTrimesters } from "@/features/catalog/hooks/useCatalog"

export interface TrimesterSelectProps {
  value: number
  onChange: (trimester: number) => void
  className?: string
  /** Muestra el rango de fechas del trimestre elegido debajo del selector. */
  showRange?: boolean
}

/** Apocopado, porque va delante del sustantivo: "1er trimestre", no "1ro trimestre". */
const ORDINAL: Record<number, string> = { 1: "1er", 2: "2do", 3: "3er" }

/**
 * El día que dice el ISO, leído como día del calendario y no como instante.
 *
 * La API manda un `LocalDate`: "2026-06-01", un día sin hora ni zona. `new Date("2026-06-01")` lo
 * interpreta como medianoche UTC, y formatearlo en la zona de la escuela — cuatro horas atrás —
 * devuelve el 31 de mayo. El trimestre entero se corre un día en las dos puntas.
 *
 * Construido campo por campo es medianoche local, que es lo que un día del calendario significa.
 */
const dayOf = (iso: string): Date | null => {
  const [year, month, day] = iso.split("-").map(Number)
  if (!year || !month || !day) return null
  const d = new Date(year, month - 1, day)
  return Number.isNaN(d.getTime()) ? null : d
}

const fmtShort = (iso: string): string => {
  const d = dayOf(iso)
  if (!d) return iso
  return d.toLocaleDateString("es-BO", { day: "2-digit", month: "2-digit" })
}

const fmtLong = (iso: string): string => {
  const d = dayOf(iso)
  if (!d) return iso
  return d.toLocaleDateString("es-BO", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  })
}

/** Selector de trimestre alimentado por el catálogo (con rango de fechas). */
export function TrimesterSelect({
  value,
  onChange,
  className,
  showRange = true,
}: TrimesterSelectProps) {
  const { data } = useTrimesters()

  // Trimestre → rango. Si el catálogo no tiene el trimestre, cae a 1/2/3 pelado.
  const byTrimester = useMemo(() => {
    const map = new Map<number, { startDate: string; endDate: string }>()
    for (const t of data ?? []) {
      map.set(t.trimester, { startDate: t.startDate, endDate: t.endDate })
    }
    return map
  }, [data])

  const selected = byTrimester.get(value)

  return (
    <div className={cn("flex flex-col items-start gap-2", className)}>
      {/*
        El control nombra el trimestre y nada más. Llevaba el rango comprimido adentro del propio
        botón — "1ro (1/2–30/4)" — y repetía las mismas fechas completas debajo: dos formatos de un
        mismo dato, el de adentro ilegible y el de abajo pegado al borde del control como si fuera
        parte de él. El rango corto queda en las opciones, que es donde ayuda a elegir.
      */}
      <Select value={String(value)} onValueChange={(v) => onChange(Number(v))}>
        <SelectTrigger className="w-44">
          {/* Children explícitos: sin ellos Radix copia el texto entero de la opción elegida, y la
              opción lleva el rango corto que justamente no va acá. */}
          <SelectValue>{ORDINAL[value]} trimestre</SelectValue>
        </SelectTrigger>
        <SelectContent>
          {[1, 2, 3].map((t) => {
            const range = byTrimester.get(t)
            return (
              <SelectItem key={t} value={String(t)}>
                {ORDINAL[t]} trimestre
                {range
                  ? ` · ${fmtShort(range.startDate)}–${fmtShort(range.endDate)}`
                  : ""}
              </SelectItem>
            )
          })}
        </SelectContent>
      </Select>
      {showRange && selected ? (
        <span
          data-testid="trimester-range"
          className="inline-flex items-center gap-1.5 rounded-md border border-border/60 bg-muted/40 px-2 py-1 text-xs text-muted-foreground"
        >
          <CalendarDays aria-hidden className="size-3.5 shrink-0 opacity-70" />
          <span>
            Del {fmtLong(selected.startDate)} al {fmtLong(selected.endDate)}
          </span>
        </span>
      ) : null}
    </div>
  )
}
