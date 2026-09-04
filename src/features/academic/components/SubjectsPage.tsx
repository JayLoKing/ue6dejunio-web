import { useMemo, useState } from "react"
import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { PencilIcon, PlusIcon, Trash2Icon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ConfirmDialog } from "@/components/shared/ConfirmDialog"
import { DataTablePagination } from "@/components/shared/DataTablePagination"
import { trimmedString } from "@/lib/validation/rules"
import type { PageQuery } from "@/lib/types/pagination"
import {
  useAllKnowledgeAreas,
  useCreateSubject,
  useDeleteSubject,
  useSubjectsAdmin,
  useUpdateSubject,
} from "../hooks/useAcademic"
import type { Subject } from "../types"

const schema = z.object({
  name: trimmedString({ min: 1, max: 100, field: "Nombre" }),
  // El área es obligatoria: la API la exige y el plan agrupa las materias por ella.
  areaId: z.number({ message: "Elige un área de saberes" }).int().positive(),
  technical: z.boolean(),
})
type FormValues = z.infer<typeof schema>

export function SubjectsPage() {
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Subject | null>(null)
  const [deleting, setDeleting] = useState<Subject | null>(null)

  const query = useMemo<PageQuery>(
    () => ({ offset: page, limit, sort: "asc" }),
    [page, limit]
  )
  const { data, isLoading, isFetching, refetch } = useSubjectsAdmin(query)
  // Todas de una: son cuatro y el selector no puede ofrecer un área que quedó fuera de una página.
  const areas = useAllKnowledgeAreas()
  const create = useCreateSubject()
  const update = useUpdateSubject()
  const remove = useDeleteSubject()

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", areaId: undefined, technical: false },
  })

  const openCreate = () => {
    setEditing(null)
    form.reset({ name: "", areaId: undefined, technical: false })
    setDialogOpen(true)
  }
  const openEdit = (s: Subject) => {
    setEditing(s)
    form.reset({ name: s.name, areaId: s.areaId, technical: s.technical })
    setDialogOpen(true)
  }

  const onSubmit = form.handleSubmit(async (v) => {
    try {
      if (editing) {
        await update.mutateAsync({
          id: editing.id,
          name: v.name,
          id_area: v.areaId,
          technical: v.technical,
        })
      } else {
        await create.mutateAsync({
          name: v.name,
          id_area: v.areaId,
          technical: v.technical,
        })
      }
      setDialogOpen(false)
    } catch {
      /* toast via interceptor */
    }
  })

  const rows = data?.content ?? []
  const saving = create.isPending || update.isPending

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <div className="flex items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold">Materias</h1>
          <p className="text-sm text-muted-foreground">
            Cada materia pertenece a un área de saberes.
          </p>
        </div>
        <Button
          className="bg-univalle text-univalle-foreground hover:bg-univalle/90"
          onClick={openCreate}
        >
          <PlusIcon data-icon="inline-start" />
          Nueva materia
        </Button>
      </div>

      {isLoading ? (
        <div className="rounded-md border border-dashed p-10 text-center text-sm text-muted-foreground">
          Cargando…
        </div>
      ) : rows.length === 0 ? (
        <div className="rounded-md border border-dashed p-10 text-center text-sm text-muted-foreground">
          Sin materias.
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {rows.map((s) => (
            <div
              key={s.id}
              className="group flex flex-col gap-3 rounded-lg border bg-card p-4 transition-colors hover:border-univalle/40"
            >
              <div className="flex items-start justify-between gap-2">
                <span className="min-w-0 truncate font-medium">{s.name}</span>
                <div className="flex shrink-0 gap-1 opacity-70 transition-opacity group-hover:opacity-100">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="size-8"
                    aria-label={`Editar ${s.name}`}
                    onClick={() => openEdit(s)}
                  >
                    <PencilIcon className="size-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="size-8 text-destructive"
                    aria-label={`Eliminar ${s.name}`}
                    onClick={() => setDeleting(s)}
                  >
                    <Trash2Icon className="size-4" />
                  </Button>
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5">
                <Badge
                  className={cn(
                    s.technical
                      ? "bg-amber-500/20 text-amber-700 dark:text-amber-300"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {s.technical ? "Técnica" : "Aula"}
                </Badge>
                <Badge variant={s.active ? "secondary" : "outline"}>
                  {s.active ? "Activa" : "Inactiva"}
                </Badge>
                {/* El área es lo que decide en qué bloque del plan se imprime la materia. */}
                <Badge variant="outline" className="font-normal">
                  {s.areaName}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      )}

      <DataTablePagination
        page={data?.page != null ? data.page + 1 : page}
        pageSize={limit}
        total={data?.total ?? 0}
        totalPages={data?.totalPages ?? 1}
        isFetching={isFetching}
        onRefresh={() => void refetch()}
        onPageChange={setPage}
        onPageSizeChange={(s) => {
          setLimit(s)
          setPage(1)
        }}
      />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editing ? "Editar materia" : "Nueva materia"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
            <Field
              data-invalid={Boolean(form.formState.errors.name) || undefined}
            >
              <FieldLabel htmlFor="subject-name">Nombre</FieldLabel>
              <Input id="subject-name" {...form.register("name")} />
              {form.formState.errors.name ? (
                <FieldError>{form.formState.errors.name.message}</FieldError>
              ) : null}
            </Field>
            <Controller
              control={form.control}
              name="areaId"
              render={({ field }) => (
                <Field
                  data-invalid={
                    Boolean(form.formState.errors.areaId) || undefined
                  }
                >
                  <FieldLabel htmlFor="subject-area">
                    Área de saberes
                  </FieldLabel>
                  <Select
                    value={field.value ? String(field.value) : undefined}
                    onValueChange={(v) => field.onChange(Number(v))}
                  >
                    <SelectTrigger id="subject-area">
                      <SelectValue placeholder="Elige un área" />
                    </SelectTrigger>
                    <SelectContent>
                      {(areas.data?.content ?? []).map((a) => (
                        <SelectItem key={a.id} value={String(a.id)}>
                          {a.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {form.formState.errors.areaId ? (
                    <FieldError>
                      {form.formState.errors.areaId.message}
                    </FieldError>
                  ) : null}
                  {(areas.data?.content ?? []).length === 0 &&
                  !areas.isLoading ? (
                    <FieldError>
                      No hay áreas de saberes cargadas. Crea una en Áreas de
                      Saberes antes de registrar materias.
                    </FieldError>
                  ) : null}
                </Field>
              )}
            />
            <Controller
              control={form.control}
              name="technical"
              render={({ field }) => (
                <Field orientation="horizontal">
                  <Checkbox
                    id="subject-technical"
                    checked={field.value}
                    onCheckedChange={(v) => field.onChange(Boolean(v))}
                  />
                  <FieldLabel
                    htmlFor="subject-technical"
                    className="font-normal"
                  >
                    Materia técnica (Música / Religión — la dicta un docente
                    técnico, o el docente de aula del curso)
                  </FieldLabel>
                </Field>
              )}
            />
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
                disabled={saving}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="bg-univalle text-univalle-foreground hover:bg-univalle/90"
                disabled={saving}
              >
                {saving ? "Guardando…" : "Guardar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={Boolean(deleting)}
        title="Eliminar materia"
        description={
          deleting ? `"${deleting.name}" será desactivada.` : undefined
        }
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
