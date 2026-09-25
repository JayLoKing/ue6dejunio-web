import { useMemo, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { PencilIcon, PlusIcon, Trash2Icon } from "lucide-react"
import type { UseMutationResult } from "@tanstack/react-query"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { ConfirmDialog } from "@/components/shared/ConfirmDialog"
import { DataTablePagination } from "@/components/shared/DataTablePagination"
import type { PageQuery, PagedResponse } from "@/lib/types/pagination"
import { trimmedString } from "@/lib/validation/rules"

export interface NameEntity {
  id: number
  name: string
}

interface FormValues {
  name: string
}

interface NameMutations {
  create: UseMutationResult<unknown, Error, { name: string }, unknown>
  update: UseMutationResult<
    unknown,
    Error,
    { id: number; name: string },
    unknown
  >
  remove: UseMutationResult<unknown, Error, number, unknown>
}

export interface NameCrudPageProps<T extends NameEntity> {
  title: string
  description: string
  label: string
  useList: (q: PageQuery) => {
    data?: PagedResponse<T>
    isLoading: boolean
    isFetching: boolean
    refetch: () => unknown
  }
  mutations: NameMutations
  maxLen?: number
}

export function NameCrudPage<T extends NameEntity>({
  title,
  description,
  label,
  useList,
  mutations,
  maxLen = 100,
}: NameCrudPageProps<T>) {
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [createOpen, setCreateOpen] = useState(false)
  const [editing, setEditing] = useState<T | null>(null)
  const [deleting, setDeleting] = useState<T | null>(null)

  const schema = useMemo(
    () =>
      z.object({ name: trimmedString({ min: 1, max: maxLen, field: label }) }),
    [maxLen, label]
  )
  const query = useMemo<PageQuery>(
    () => ({ offset: page, limit, sort: "asc" }),
    [page, limit]
  )
  const { data, isLoading, isFetching, refetch } = useList(query)
  const rows = data?.content ?? []

  const createForm = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "" },
  })
  const editForm = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "" },
  })

  const onCreate = createForm.handleSubmit(async (v) => {
    try {
      await mutations.create.mutateAsync({ name: v.name })
      createForm.reset()
      setCreateOpen(false)
    } catch {
      /* toast via interceptor */
    }
  })

  const openEdit = (row: T) => {
    setEditing(row)
    editForm.reset({ name: row.name })
  }

  const onEdit = editForm.handleSubmit(async (v) => {
    if (!editing) return
    try {
      await mutations.update.mutateAsync({ id: editing.id, name: v.name })
      setEditing(null)
    } catch {
      /* toast via interceptor */
    }
  })

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <div className="flex items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold">{title}</h1>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>

        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button className="bg-brand text-brand-foreground hover:bg-brand/90">
              <PlusIcon data-icon="inline-start" />
              Nuevo {label.toLowerCase()}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Nuevo {label.toLowerCase()}</DialogTitle>
            </DialogHeader>
            <form onSubmit={onCreate} noValidate>
              <Field
                data-invalid={
                  Boolean(createForm.formState.errors.name) || undefined
                }
              >
                <FieldLabel htmlFor="create-name">{label}</FieldLabel>
                <Input id="create-name" {...createForm.register("name")} />
                {createForm.formState.errors.name ? (
                  <FieldError>
                    {createForm.formState.errors.name.message}
                  </FieldError>
                ) : null}
              </Field>
              <DialogFooter className="mt-6">
                <Button
                  type="submit"
                  className="bg-brand text-brand-foreground hover:bg-brand/90"
                  disabled={mutations.create.isPending}
                >
                  {mutations.create.isPending ? "Creando…" : "Crear"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="rounded-md border border-dashed p-10 text-center text-sm text-muted-foreground">
          Cargando…
        </div>
      ) : rows.length === 0 ? (
        <div className="rounded-md border border-dashed p-10 text-center text-sm text-muted-foreground">
          Sin registros.
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {rows.map((row) => (
            <div
              key={row.id}
              className="group flex items-center justify-between gap-2 rounded-lg border bg-card p-4 transition-colors hover:border-brand/40"
            >
              <span className="min-w-0 truncate font-medium">{row.name}</span>
              <div className="flex shrink-0 gap-1 opacity-70 transition-opacity group-hover:opacity-100">
                <Button
                  size="icon"
                  variant="ghost"
                  className="size-8"
                  aria-label={`Editar ${row.name}`}
                  onClick={() => openEdit(row)}
                >
                  <PencilIcon className="size-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="size-8 text-destructive"
                  aria-label={`Eliminar ${row.name}`}
                  onClick={() => setDeleting(row)}
                >
                  <Trash2Icon className="size-4" />
                </Button>
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

      <Dialog
        open={Boolean(editing)}
        onOpenChange={(o) => !o && setEditing(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Editar {label.toLowerCase()}</DialogTitle>
          </DialogHeader>
          <form onSubmit={onEdit} noValidate>
            <Field
              data-invalid={
                Boolean(editForm.formState.errors.name) || undefined
              }
            >
              <FieldLabel htmlFor="edit-name">{label}</FieldLabel>
              <Input id="edit-name" {...editForm.register("name")} />
              {editForm.formState.errors.name ? (
                <FieldError>
                  {editForm.formState.errors.name.message}
                </FieldError>
              ) : null}
            </Field>
            <DialogFooter className="mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditing(null)}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="bg-brand text-brand-foreground hover:bg-brand/90"
                disabled={mutations.update.isPending}
              >
                {mutations.update.isPending ? "Guardando…" : "Guardar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={Boolean(deleting)}
        title={`Eliminar ${label.toLowerCase()}`}
        description={
          deleting ? `"${deleting.name}" será eliminado.` : undefined
        }
        confirmLabel="Eliminar"
        destructive
        loading={mutations.remove.isPending}
        onConfirm={() => {
          if (!deleting) return
          mutations.remove.mutate(deleting.id, {
            onSuccess: () => setDeleting(null),
          })
        }}
        onOpenChange={(o) => !o && setDeleting(null)}
      />
    </div>
  )
}
