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

const ORDINAL: Record<number, string> = { 1: "1ro", 2: "2do", 3: "3ro" }

const fmtShort = (iso: string): string => {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString("es-BO", { day: "2-digit", month: "2-digit" })
}

const fmtLong = (iso: string): string => {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
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
    <div className={cn("flex flex-col gap-0.5", className)}>
      <Select value={String(value)} onValueChange={(v) => onChange(Number(v))}>
        <SelectTrigger className="w-44">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {[1, 2, 3].map((t) => {
            const range = byTrimester.get(t)
            return (
              <SelectItem key={t} value={String(t)}>
                {ORDINAL[t]}
                {range
                  ? ` (${fmtShort(range.startDate)}–${fmtShort(range.endDate)})`
                  : ""}
              </SelectItem>
            )
          })}
        </SelectContent>
      </Select>
      {showRange && selected ? (
        <span className="text-[11px] text-muted-foreground">
          {fmtLong(selected.startDate)} – {fmtLong(selected.endDate)}
        </span>
      ) : null}
    </div>
  )
}
