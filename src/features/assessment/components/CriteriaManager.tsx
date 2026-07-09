import { useMemo, useState } from "react"
import { Loader2Icon, PencilIcon, PlusIcon, Trash2Icon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ConfirmDialog } from "@/components/shared/ConfirmDialog"

import {
  DIMENSIONS,
  type AssessmentEvent,
  type Criterion,
  type DimensionMeta,
} from "../types"
import {
  useCreateCriterion,
  useCreateEvent,
  useCriteria,
  useCriteriaEvents,
  useDeleteCriterion,
  useDeleteEvent,
  useUpdateCriterion,
} from "../hooks/useAssessment"

export interface CriteriaManagerProps {
  classGroupId: string
  trimester: number
}

function DimensionBlock({
  dim,
  classGroupId,
  trimester,
  criteria,
  eventsByCriterion,
  eventsLoading,
}: {
  dim: DimensionMeta
  classGroupId: string
  trimester: number
  criteria: Criterion[]
  eventsByCriterion: Record<string, AssessmentEvent[]>
  eventsLoading: boolean
}) {
  const create = useCreateCriterion()
  const update = useUpdateCriterion()
  const remove = useDeleteCriterion()
  const createEvent = useCreateEvent()
  const removeEvent = useDeleteEvent()

  const [name, setName] = useState("")
  const [weight, setWeight] = useState("")
  const [editing, setEditing] = useState<Criterion | null>(null)
  const [deleting, setDeleting] = useState<Criterion | null>(null)
  const [activityDraft, setActivityDraft] = useState<Record<string, string>>({})

  const used = useMemo(
    () => criteria.reduce((a, c) => a + Number(c.maxWeight), 0),
    [criteria],
  )
  const remaining = dim.weight - used
  const w = Number(weight) || 0
  const exceed = w > remaining + 0.0001
  const canAdd = name.trim().length > 0 && w > 0 && !exceed && !create.isPending

  return (
    <div className="rounded-md border">
      <div className="flex items-center justify-between border-b bg-muted/40 px-3 py-2">
        <span className="font-semibold">
          {dim.label}{" "}
          <span className="text-xs font-normal text-muted-foreground">
            tope {dim.weight}
          </span>
        </span>
        <Badge
          variant={used > dim.weight ? "outline" : "secondary"}
          className={cn(used > dim.weight && "text-destructive")}
        >
          Usado {used}/{dim.weight}
        </Badge>
      </div>

      <ul className="divide-y">
        {criteria.length === 0 ? (
          <li className="px-3 py-2 text-sm text-muted-foreground">Sin criterios.</li>
        ) : (
          criteria.map((c) => {
            const evs = eventsByCriterion[c.id] ?? []
            const draft = activityDraft[c.id] ?? ""
            return (
              <li key={c.id} className="px-3 py-2">
                <div className="flex items-center gap-2">
                  <span className="flex-1 text-sm font-medium">{c.name}</span>
                  <Badge variant="secondary">peso {c.maxWeight}</Badge>
                  <Button size="icon" variant="ghost" className="size-7" onClick={() => setEditing(c)}>
                    <PencilIcon className="size-3.5" />
                  </Button>
                  <Button size="icon" variant="ghost" className="size-7 text-destructive" onClick={() => setDeleting(c)}>
                    <Trash2Icon className="size-3.5" />
                  </Button>
                </div>
                <div className="mt-1.5 flex flex-wrap items-center gap-1.5 pl-2">
                  {eventsLoading ? (
                    <Loader2Icon className="size-3.5 animate-spin text-muted-foreground" />
                  ) : (
                    evs.map((e) => (
                      <Badge key={e.id} variant="outline" className="gap-1">
                        {e.title}
                        <button type="button" className="text-destructive" onClick={() => removeEvent.mutate(e.id)}>
                          ×
                        </button>
                      </Badge>
                    ))
                  )}
                  <div className="flex items-center gap-1">
                    <Input
                      value={draft}
                      onChange={(ev) => setActivityDraft((d) => ({ ...d, [c.id]: ev.target.value }))}
                      placeholder="Nueva actividad"
                      className="h-7 w-40 text-xs"
                    />
                    <Button
                      size="icon"
                      variant="ghost"
                      className="size-7"
                      disabled={!draft.trim() || createEvent.isPending}
                      onClick={() =>
                        createEvent.mutate(
                          { id_criterion: c.id, title: draft.trim() },
                          { onSuccess: () => setActivityDraft((d) => ({ ...d, [c.id]: "" })) },
                        )
                      }
                    >
                      <PlusIcon className="size-3.5" />
                    </Button>
                  </div>
                </div>
              </li>
            )
          })
        )}
      </ul>

      <div className="flex items-center gap-2 border-t p-2">
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nombre del criterio" className="h-8 flex-1" />
        <Input value={weight} onChange={(e) => setWeight(e.target.value)} type="number" step="0.5" placeholder="peso" className={cn("h-8 w-20", exceed && "border-destructive")} />
        <Button
          size="sm"
          disabled={!canAdd}
          className="bg-univalle text-univalle-foreground hover:bg-univalle/90"
          onClick={() =>
            create.mutate(
              {
                id_class_group: classGroupId,
                trimester,
                dimension: dim.key,
                name: name.trim(),
                maxWeight: w,
              },
              { onSuccess: () => { setName(""); setWeight("") } },
            )
          }
        >
          <PlusIcon data-icon="inline-start" /> Agregar
        </Button>
      </div>
      {exceed ? (
        <p className="px-3 pb-2 text-xs text-destructive">
          Excede el tope. Disponible: {remaining}.
        </p>
      ) : null}

      {editing ? (
        <EditCriterionInline
          criterion={editing}
          remaining={remaining + Number(editing.maxWeight)}
          onClose={() => setEditing(null)}
          saving={update.isPending}
          onSave={(payload) =>
            update.mutate({ id: editing.id, payload }, { onSuccess: () => setEditing(null) })
          }
        />
      ) : null}

      <ConfirmDialog
        open={Boolean(deleting)}
        title="Eliminar criterio"
        description={deleting ? `"${deleting.name}" y sus actividades/notas seran eliminados.` : undefined}
        confirmLabel="Eliminar"
        destructive
        loading={remove.isPending}
        onConfirm={() => {
          if (!deleting) return
          remove.mutate(deleting.id, { onSuccess: () => setDeleting(null) })
        }}
        onOpenChange={(o) => !o && setDeleting(null)}
      />
    </div>
  )
}

function EditCriterionInline({
  criterion,
  remaining,
  onClose,
  onSave,
  saving,
}: {
  criterion: Criterion
  remaining: number
  onClose: () => void
  onSave: (p: { name: string; maxWeight: number }) => void
  saving: boolean
}) {
  const [name, setName] = useState(criterion.name)
  const [weight, setWeight] = useState(String(criterion.maxWeight))
  const w = Number(weight) || 0
  const exceed = w > remaining + 0.0001
  return (
    <div className="flex items-center gap-2 border-t bg-muted/20 p-2">
      <Input value={name} onChange={(e) => setName(e.target.value)} className="h-8 flex-1" />
      <Input value={weight} onChange={(e) => setWeight(e.target.value)} type="number" step="0.5" className={cn("h-8 w-20", exceed && "border-destructive")} />
      <Button size="sm" variant="outline" onClick={onClose}>Cancelar</Button>
      <Button size="sm" disabled={saving || exceed || !name.trim()} onClick={() => onSave({ name: name.trim(), maxWeight: w })}>
        Guardar
      </Button>
    </div>
  )
}

export function CriteriaManager({ classGroupId, trimester }: CriteriaManagerProps) {
  const { data: criteria = [], isLoading } = useCriteria(classGroupId, trimester)
  const { byCriterion, isLoading: evLoading } = useCriteriaEvents(criteria)

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2Icon className="size-4 animate-spin" /> Cargando criterios…
      </div>
    )
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {DIMENSIONS.map((dim) => (
        <DimensionBlock
          key={dim.key}
          dim={dim}
          classGroupId={classGroupId}
          trimester={trimester}
          criteria={criteria.filter((c) => c.dimension === dim.key)}
          eventsByCriterion={byCriterion}
          eventsLoading={evLoading}
        />
      ))}
    </div>
  )
}
