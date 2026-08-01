import { useMemo, useState } from "react"
import { Link } from "@tanstack/react-router"
import {
  ClipboardListIcon,
  Loader2Icon,
  PencilIcon,
  PlusIcon,
  Trash2Icon,
} from "lucide-react"

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

interface DimensionBlockProps {
  dim: DimensionMeta
  classGroupId: string
  trimester: number
  criteria: Criterion[]
  eventsByCriterion: Record<string, AssessmentEvent[]>
  eventsLoading: boolean
}

function DimensionBlock({
  dim,
  classGroupId,
  trimester,
  criteria,
  eventsByCriterion,
  eventsLoading,
}: DimensionBlockProps) {
  const create = useCreateCriterion()
  const update = useUpdateCriterion()
  const remove = useDeleteCriterion()
  const createEvent = useCreateEvent()
  const removeEvent = useDeleteEvent()

  const [name, setName] = useState("")
  const [editing, setEditing] = useState<Criterion | null>(null)
  const [deleting, setDeleting] = useState<Criterion | null>(null)
  const [activityDraft, setActivityDraft] = useState<Record<string, string>>({})

  const canAdd = name.trim().length > 0 && !create.isPending

  return (
    <div className="rounded-md border">
      <div className="flex items-center justify-between border-b bg-muted/40 px-3 py-2">
        <span className="font-semibold">{dim.label}</span>
        {/* Tope informativo: nota máxima de la dimensión. */}
        <Badge variant="secondary">Nota máxima {dim.weight}</Badge>
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
                  <Button
                    size="icon"
                    variant="ghost"
                    className="size-7"
                    title="Notas de este criterio"
                    asChild
                  >
                    <Link
                      to="/scores/$classGroupId/criterio/$criterionId"
                      params={{ classGroupId, criterionId: c.id }}
                      search={{ trimester }}
                    >
                      <ClipboardListIcon className="size-3.5" />
                    </Link>
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="size-7"
                    aria-label={`Editar criterio ${c.name}`}
                    onClick={() => setEditing(c)}
                  >
                    <PencilIcon className="size-3.5" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="size-7 text-destructive"
                    aria-label={`Eliminar criterio ${c.name}`}
                    onClick={() => setDeleting(c)}
                  >
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
                        <button
                          type="button"
                          className="text-destructive"
                          aria-label={`Quitar actividad ${e.title}`}
                          onClick={() => removeEvent.mutate(e.id)}
                        >
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
                      aria-label="Agregar actividad"
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
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nombre del criterio"
          className="h-8 flex-1"
        />
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
              },
              { onSuccess: () => setName("") },
            )
          }
        >
          <PlusIcon data-icon="inline-start" /> Agregar
        </Button>
      </div>

      {editing ? (
        <EditCriterionInline
          criterion={editing}
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
        description={deleting ? `"${deleting.name}" y sus actividades/notas serán eliminados.` : undefined}
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

interface EditCriterionInlineProps {
  criterion: Criterion
  onClose: () => void
  onSave: (p: { name: string }) => void
  saving: boolean
}

function EditCriterionInline({
  criterion,
  onClose,
  onSave,
  saving,
}: EditCriterionInlineProps) {
  const [name, setName] = useState(criterion.name)
  return (
    <div className="flex items-center gap-2 border-t bg-muted/20 p-2">
      <Input value={name} onChange={(e) => setName(e.target.value)} className="h-8 flex-1" />
      <Button size="sm" variant="outline" onClick={onClose}>
        Cancelar
      </Button>
      <Button size="sm" disabled={saving || !name.trim()} onClick={() => onSave({ name: name.trim() })}>
        Guardar
      </Button>
    </div>
  )
}

export function CriteriaManager({ classGroupId, trimester }: CriteriaManagerProps) {
  const criteriaQuery = useCriteria(classGroupId, trimester)
  const isLoading = criteriaQuery.isLoading
  // Ref estable: evita recrear la cadena de memos cada render.
  const criteria = useMemo(
    () => criteriaQuery.data ?? [],
    [criteriaQuery.data],
  )
  const { byCriterion, isLoading: evLoading } = useCriteriaEvents(criteria)

  // Agrupa una sola vez por dimensión (evita filtrar por cada dimensión en cada render).
  const byDimension = useMemo(() => {
    const out: Record<string, typeof criteria> = {}
    for (const d of DIMENSIONS) out[d.key] = []
    for (const c of criteria) (out[c.dimension] ??= []).push(c)
    return out
  }, [criteria])

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
          criteria={byDimension[dim.key] ?? []}
          eventsByCriterion={byCriterion}
          eventsLoading={evLoading}
        />
      ))}
    </div>
  )
}
