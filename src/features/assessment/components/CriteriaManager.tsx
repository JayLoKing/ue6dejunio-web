import { useMemo, useState } from "react"
import { Link } from "@tanstack/react-router"
import {
  ClipboardListIcon,
  Loader2Icon,
  PencilIcon,
  PlusIcon,
  Trash2Icon,
} from "lucide-react"

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
  /** true = solo visualizar criterios/actividades (docente de aula en materia técnica). */
  readOnly?: boolean
}

interface DimensionBlockProps {
  dim: DimensionMeta
  classGroupId: string
  trimester: number
  criteria: Criterion[]
  eventsByCriterion: Record<string, AssessmentEvent[]>
  eventsLoading: boolean
  readOnly: boolean
}

function DimensionBlock({
  dim,
  classGroupId,
  trimester,
  criteria,
  eventsByCriterion,
  eventsLoading,
  readOnly,
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

  // Alta opcional de la actividad junto al criterio, en un solo POST.
  const [withActivity, setWithActivity] = useState(false)
  const [activityTitle, setActivityTitle] = useState("")
  const [items, setItems] = useState<string[]>([])
  const [itemDraft, setItemDraft] = useState("")

  // Repetidos se rechazan sin distinguir mayúsculas, igual que el backend: dos casillas
  // con el mismo nombre son indistinguibles para el docente.
  const canAddItem =
    itemDraft.trim().length > 0 &&
    !items.some((i) => i.toLowerCase() === itemDraft.trim().toLowerCase())

  const addItem = () => {
    if (!canAddItem) return
    setItems((prev) => [...prev, itemDraft.trim()])
    setItemDraft("")
  }

  const canAdd =
    name.trim().length > 0 &&
    !create.isPending &&
    (!withActivity || (activityTitle.trim().length > 0 && items.length > 0))

  const submitCriterion = () => {
    if (!canAdd) return
    create.mutate(
      {
        id_class_group: classGroupId,
        trimester,
        dimension: dim.key,
        name: name.trim(),
        ...(withActivity
          ? { activity: { title: activityTitle.trim(), items } }
          : {}),
      },
      {
        onSuccess: () => {
          setName("")
          setWithActivity(false)
          setActivityTitle("")
          setItems([])
          setItemDraft("")
        },
      },
    )
  }

  return (
    <div className={cn("overflow-hidden rounded-md border", dim.color.border)}>
      <div
        className={cn(
          "flex items-center justify-between gap-2 border-b px-3 py-2",
          dim.color.soft,
        )}
      >
        <span className="flex items-center gap-2 font-semibold">
          <span className={cn("h-4 w-1.5 rounded-full", dim.color.bar)} />
          {dim.label}
        </span>
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
            // Tener items es lo que define el criterio de actividad, no el nombre: los
            // criterios anteriores a `activityName` lo traen en null y ya tienen items.
            const activityBased = c.activityName !== null || evs.length > 0
            return (
              <li key={c.id} className="px-3 py-2">
                <div className="flex items-center gap-2">
                  <span className="flex-1 text-sm font-medium">
                    {c.name}
                    {c.activityName ? (
                      <span className="ml-2 text-xs font-normal text-muted-foreground">
                        actividad: {c.activityName}
                      </span>
                    ) : null}
                  </span>
                  {readOnly ? null : (
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
                  )}
                  {readOnly ? null : (
                    <>
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
                    </>
                  )}
                </div>
                {/* Hasta que los items lleguen, `evs` está vacío y un criterio antiguo
                    pasaría por directo: se decide recién con la lista cargada. */}
                {eventsLoading ? (
                  <div className="mt-1.5 pl-2">
                    <Loader2Icon className="size-3.5 animate-spin text-muted-foreground" />
                  </div>
                ) : activityBased ? (
                  <div className="mt-1.5 flex flex-wrap items-center gap-1.5 pl-2">
                    {evs.map((e) => (
                        <Badge key={e.id} variant="outline" className="gap-1">
                          {e.title}
                          {/* El último item no se puede quitar: dejaría la actividad sin nada
                              que promediar y sin poder recibir nota directa. El backend
                              responde 409; aquí se desactiva antes de llegar. */}
                          {readOnly || evs.length === 1 ? null : (
                            <button
                              type="button"
                              className="text-destructive"
                              aria-label={`Quitar criterio ${e.title}`}
                              onClick={() => removeEvent.mutate(e.id)}
                            >
                              ×
                            </button>
                          )}
                        </Badge>
                    ))}
                    {readOnly ? null : (
                      <div className="flex items-center gap-1">
                        <Input
                          value={draft}
                          onChange={(ev) => setActivityDraft((d) => ({ ...d, [c.id]: ev.target.value }))}
                          placeholder="Nuevo criterio"
                          className="h-7 w-40 text-xs"
                        />
                        <Button
                          size="icon"
                          variant="ghost"
                          className="size-7"
                          aria-label="Agregar criterio de actividad"
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
                    )}
                  </div>
                ) : (
                  <p className="mt-1 pl-2 text-xs text-muted-foreground">
                    Calificación directa: la nota se registra sobre el criterio.
                  </p>
                )}
              </li>
            )
          })
        )}
      </ul>

      {readOnly ? null : (
        <div className="flex flex-col gap-2 border-t p-2">
          <div className="flex items-center gap-2">
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
              onClick={submitCriterion}
            >
              <PlusIcon data-icon="inline-start" /> Agregar
            </Button>
          </div>

          <label className="flex items-center gap-2 text-xs text-muted-foreground">
            <input
              type="checkbox"
              checked={withActivity}
              onChange={(e) => setWithActivity(e.target.checked)}
              className="size-3.5"
            />
            Proviene de una actividad
          </label>

          {withActivity ? (
            <div className="flex flex-col gap-2 rounded-md border bg-muted/20 p-2">
              <Input
                value={activityTitle}
                onChange={(e) => setActivityTitle(e.target.value)}
                placeholder="Nombre de la actividad (ej. Revisión de Cuadernos)"
                className="h-8"
              />
              <div className="flex flex-wrap items-center gap-1.5">
                {items.map((it) => (
                  <Badge key={it} variant="outline" className="gap-1">
                    {it}
                    <button
                      type="button"
                      className="text-destructive"
                      aria-label={`Quitar ${it}`}
                      onClick={() => setItems((prev) => prev.filter((x) => x !== it))}
                    >
                      ×
                    </button>
                  </Badge>
                ))}
                <div className="flex items-center gap-1">
                  <Input
                    value={itemDraft}
                    onChange={(e) => setItemDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key !== "Enter") return
                      e.preventDefault()
                      addItem()
                    }}
                    placeholder="Criterio de la actividad (ej. Tema 1)"
                    className="h-7 w-56 text-xs"
                  />
                  <Button
                    size="icon"
                    variant="ghost"
                    className="size-7"
                    aria-label="Agregar criterio a la actividad"
                    disabled={!canAddItem}
                    onClick={addItem}
                  >
                    <PlusIcon className="size-3.5" />
                  </Button>
                </div>
              </div>
              <p className="text-[11px] text-muted-foreground">
                La nota del criterio será el promedio de estos criterios. Se necesita al
                menos uno.
              </p>
            </div>
          ) : null}
        </div>
      )}

      {editing ? (
        <EditCriterionInline
          key={editing.id}
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

export function CriteriaManager({
  classGroupId,
  trimester,
  readOnly = false,
}: CriteriaManagerProps) {
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
    <div className="flex flex-col gap-4">
      {DIMENSIONS.map((dim) => (
        <DimensionBlock
          key={dim.key}
          dim={dim}
          classGroupId={classGroupId}
          trimester={trimester}
          criteria={byDimension[dim.key] ?? []}
          eventsByCriterion={byCriterion}
          eventsLoading={evLoading}
          readOnly={readOnly}
        />
      ))}
    </div>
  )
}
