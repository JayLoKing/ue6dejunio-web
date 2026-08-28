import { useState } from "react"
import { Loader2Icon } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Field, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"

import { useAddProgress, usePdcProgress } from "../hooks/usePdc"
import { planLabel } from "../utils/planLabel"
import type { Pdc } from "../types"

export interface PdcProgressDialogProps {
  pdc: Pdc | null
  onClose: () => void
}

export function PdcProgressDialog({ pdc, onClose }: PdcProgressDialogProps) {
  const list = usePdcProgress(pdc?.id ?? null)
  const add = useAddProgress(pdc?.id ?? "")

  const [date, setDate] = useState("")
  const [content, setContent] = useState("")
  const [percentage, setPercentage] = useState("")
  const [observations, setObservations] = useState("")

  const reset = () => {
    setDate("")
    setContent("")
    setPercentage("")
    setObservations("")
  }

  const submit = () => {
    if (!pdc) return
    add.mutate(
      {
        progressDate: date || undefined,
        advancedContent: content || undefined,
        percentage: percentage ? Number(percentage) : undefined,
        observations: observations || undefined,
      },
      { onSuccess: reset },
    )
  }

  return (
    <Dialog open={Boolean(pdc)} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Avance del PDC</DialogTitle>
          <DialogDescription>{pdc ? planLabel(pdc) : null}</DialogDescription>
        </DialogHeader>

        {/* form */}
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
            <Field>
              <FieldLabel htmlFor="pr-date">Fecha</FieldLabel>
              <Input id="pr-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </Field>
            <Field>
              <FieldLabel htmlFor="pr-pct">% Avance</FieldLabel>
              <Input id="pr-pct" type="number" min={0} max={100} step={1} value={percentage} onChange={(e) => setPercentage(e.target.value)} />
            </Field>
          </div>
          <Field>
            <FieldLabel htmlFor="pr-content">Contenido avanzado</FieldLabel>
            <Textarea id="pr-content" rows={2} value={content} onChange={(e) => setContent(e.target.value)} />
          </Field>
          <Field>
            <FieldLabel htmlFor="pr-obs">Observaciones</FieldLabel>
            <Textarea id="pr-obs" rows={2} value={observations} onChange={(e) => setObservations(e.target.value)} />
          </Field>
          <div className="flex justify-end">
            <Button
              className="bg-univalle text-univalle-foreground hover:bg-univalle/90"
              disabled={add.isPending || (!content && !percentage)}
              onClick={submit}
            >
              {add.isPending ? "Guardando…" : "Registrar avance"}
            </Button>
          </div>
        </div>

        {/* list */}
        <div className="mt-2 border-t pt-3">
          <p className="mb-2 text-sm font-medium">Historial</p>
          {list.isLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2Icon className="size-4 animate-spin" /> Cargando…
            </div>
          ) : (list.data ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin avances registrados.</p>
          ) : (
            <ScrollArea className="max-h-56">
              <ul className="flex flex-col gap-2">
                {(list.data ?? []).map((p) => (
                  <li key={p.id} className="rounded-md border p-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">{p.progressDate ?? "—"}</span>
                      {p.percentage != null ? <Badge variant="secondary">{Number(p.percentage)}%</Badge> : null}
                    </div>
                    {p.advancedContent ? <p>{p.advancedContent}</p> : null}
                    {p.observations ? <p className="text-xs text-muted-foreground">{p.observations}</p> : null}
                  </li>
                ))}
              </ul>
            </ScrollArea>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
