import { useMemo, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { PencilIcon, PlusIcon, Trash2Icon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { ConfirmDialog } from "@/components/shared/ConfirmDialog"
import { DataTablePagination } from "@/components/shared/DataTablePagination"
import { trimmedString } from "@/lib/validation/rules"
import type { PageQuery } from "@/lib/types/pagination"
import {
  useCreateKnowledgeArea,
  useDeleteKnowledgeArea,
  useKnowledgeAreas,
  useUpdateKnowledgeArea,
} from "../hooks/useAcademic"
import { isValidDisplayOrder, toDisplayOrder } from "../utils/displayOrder"
import type { KnowledgeArea } from "../types"

const schema = z.object({
  name: trimmedString({ min: 1, max: 80, field: "Nombre" }),
  displayOrder: z
    .string()
    .refine(isValidDisplayOrder, "Debe ser un número entero de 1 o mayor"),
})
type FormValues = z.infer<typeof schema>

export function KnowledgeAreasPage() {
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<KnowledgeArea | null>(null)
  const [deleting, setDeleting] = useState<KnowledgeArea | null>(null)

  const query = useMemo<PageQuery>(
    () => ({ offset: page, limit, sort: "asc" }),
    [page, limit]
  )
  const { data, isLoading, isFetching, refetch } = useKnowledgeAreas(query)
  const create = useCreateKnowledgeArea()
  const update = useUpdateKnowledgeArea()
  const remove = useDeleteKnowledgeArea()

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", displayOrder: "" },
  })

  const openCreate = () => {
    setEditing(null)
    form.reset({ name: "", displayOrder: "" })
    setDialogOpen(true)
  }
  const openEdit = (a: KnowledgeArea) => {
    setEditing(a)
    form.reset({ name: a.name, displayOrder: String(a.displayOrder) })
    setDialogOpen(true)
  }

  const onSubmit = form.handleSubmit(async (v) => {
    const displayOrder = toDisplayOrder(v.displayOrder)
    try {
      if (editing) {
        await update.mutateAsync({ id: editing.id, name: v.name, displayOrder })
      } else {
        await create.mutateAsync({ name: v.name, displayOrder })
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
          <h1 className="text-2xl font-semibold">Áreas de Saberes</h1>
          <p className="text-sm text-muted-foreground">
            Agrupan a las materias. El plan de desarrollo curricular se imprime
            en este orden.
          </p>
        </div>
        <Button
          className="bg-univalle text-univalle-foreground hover:bg-univalle/90"
          onClick={openCreate}
        >
          <PlusIcon data-icon="inline-start" />
          Nueva área
        </Button>
      </div>

      {isLoading ? (
        <div className="rounded-md border border-dashed p-10 text-center text-sm text-muted-foreground">
          Cargando…
        </div>
      ) : rows.length === 0 ? (
        <div className="rounded-md border border-dashed p-10 text-center text-sm text-muted-foreground">
          Sin áreas de saberes. Hay que crear al menos una antes de registrar
          materias.
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {rows.map((a) => (
            <div
              key={a.id}
              className="group flex flex-col gap-3 rounded-lg border bg-card p-4 transition-colors hover:border-univalle/40"
            >
              <div className="flex items-start justify-between gap-2">
                <span className="min-w-0 font-medium">{a.name}</span>
                <div className="flex shrink-0 gap-1 opacity-70 transition-opacity group-hover:opacity-100">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="size-8"
                    aria-label={`Editar ${a.name}`}
                    onClick={() => openEdit(a)}
                  >
                    <PencilIcon className="size-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="size-8 text-destructive"
                    aria-label={`Eliminar ${a.name}`}
                    onClick={() => setDeleting(a)}
                  >
                    <Trash2Icon className="size-4" />
                  </Button>
                </div>
              </div>
              <Badge variant="secondary" className="w-fit">
                Orden {a.displayOrder}
              </Badge>
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
              {editing ? "Editar área de saberes" : "Nueva área de saberes"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
            <Field
              data-invalid={Boolean(form.formState.errors.name) || undefined}
            >
              <FieldLabel htmlFor="area-name">Nombre</FieldLabel>
              <Input id="area-name" {...form.register("name")} />
              {form.formState.errors.name ? (
                <FieldError>{form.formState.errors.name.message}</FieldError>
              ) : null}
            </Field>
            <Field
              data-invalid={
                Boolean(form.formState.errors.displayOrder) || undefined
              }
            >
              <FieldLabel htmlFor="area-order">
                Orden en el plan (opcional)
              </FieldLabel>
              <Input
                id="area-order"
                inputMode="numeric"
                placeholder={
                  editing ? "Vacío: se queda donde está" : "Vacío: va al final"
                }
                {...form.register("displayOrder")}
              />
              {form.formState.errors.displayOrder ? (
                <FieldError>
                  {form.formState.errors.displayOrder.message}
                </FieldError>
              ) : null}
            </Field>
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
                Guardar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={Boolean(deleting)}
        title="Eliminar área de saberes"
        description={
          deleting
            ? `"${deleting.name}" se eliminará. Si tiene materias asociadas, el sistema no lo permitirá.`
            : undefined
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
