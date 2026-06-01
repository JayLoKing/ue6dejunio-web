import { useMemo, useState } from "react"
import { createFileRoute, redirect } from "@tanstack/react-router"
import { useForm, Controller, type Resolver } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { PencilIcon, PlusIcon, Trash2Icon } from "lucide-react"

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ConfirmDialog } from "@/components/shared/ConfirmDialog"
import { DataTablePagination } from "@/components/shared/DataTablePagination"
import { trimmedString } from "@/lib/validation/rules"
import type { PageQuery } from "@/lib/types/pagination"
import { useAuthStore } from "@/features/auth/store/authStore"
import { isRole } from "@/features/auth/types"
import {
  useCreateGrade,
  useDeleteGrade,
  useGradesAdmin,
  useLevels,
  useUpdateGrade,
} from "@/features/academic/hooks/useAcademic"
import type { Grade } from "@/features/academic/types"

export const Route = createFileRoute("/_app/grades")({
  beforeLoad: () => {
    if (!isRole(useAuthStore.getState().role, "DIRECTOR")) {
      throw redirect({ to: "/dashboard" })
    }
  },
  component: GradesPage,
})

const schema = z.object({
  name: trimmedString({ min: 1, max: 50, field: "Nombre" }),
  levelId: z.coerce.number().int().positive("Selecciona nivel"),
})
type FormValues = z.infer<typeof schema>

function GradesPage() {
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Grade | null>(null)
  const [deleting, setDeleting] = useState<Grade | null>(null)

  const query = useMemo<PageQuery>(
    () => ({ offset: page, limit, sort: "asc" }),
    [page, limit],
  )
  const { data, isLoading, isFetching } = useGradesAdmin(query)
  const levels = useLevels({ offset: 1, limit: 100, sort: "asc" })
  const create = useCreateGrade()
  const update = useUpdateGrade()
  const remove = useDeleteGrade()

  const form = useForm<FormValues>({
    resolver: zodResolver(schema) as Resolver<FormValues>,
    defaultValues: { name: "", levelId: 0 },
  })

  const openCreate = () => {
    setEditing(null)
    form.reset({ name: "", levelId: 0 })
    setDialogOpen(true)
  }
  const openEdit = (g: Grade) => {
    setEditing(g)
    form.reset({ name: g.name, levelId: g.levelId })
    setDialogOpen(true)
  }

  const onSubmit = form.handleSubmit(async (v) => {
    try {
      if (editing) {
        await update.mutateAsync({ id: editing.id, name: v.name, id_level: v.levelId })
      } else {
        await create.mutateAsync({ name: v.name, id_level: v.levelId })
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
          <h1 className="text-2xl font-semibold">Grados</h1>
          <p className="text-sm text-muted-foreground">
            Grados por nivel (max 6 en primaria).
          </p>
        </div>
        <Button
          className="bg-univalle text-univalle-foreground hover:bg-univalle/90"
          onClick={openCreate}
        >
          <PlusIcon data-icon="inline-start" />
          Nuevo grado
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Grado</TableHead>
              <TableHead>Nivel</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-muted-foreground">
                  Cargando…
                </TableCell>
              </TableRow>
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-muted-foreground">
                  Sin grados.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((g) => (
                <TableRow key={g.id}>
                  <TableCell>{g.name}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {g.levelName}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="size-8"
                        onClick={() => openEdit(g)}
                      >
                        <PencilIcon className="size-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="size-8 text-destructive"
                        onClick={() => setDeleting(g)}
                      >
                        <Trash2Icon className="size-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <DataTablePagination
        page={data?.page != null ? data.page + 1 : page}
        pageSize={limit}
        total={data?.total ?? 0}
        totalPages={data?.totalPages ?? 1}
        isFetching={isFetching}
        onPageChange={setPage}
        onPageSizeChange={(s) => {
          setLimit(s)
          setPage(1)
        }}
      />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar grado" : "Nuevo grado"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
            <Field data-invalid={Boolean(form.formState.errors.name) || undefined}>
              <FieldLabel htmlFor="grade-name">Nombre</FieldLabel>
              <Input id="grade-name" {...form.register("name")} />
              {form.formState.errors.name ? (
                <FieldError>{form.formState.errors.name.message}</FieldError>
              ) : null}
            </Field>
            <Controller
              control={form.control}
              name="levelId"
              render={({ field }) => (
                <Field data-invalid={Boolean(form.formState.errors.levelId) || undefined}>
                  <FieldLabel htmlFor="grade-level">Nivel</FieldLabel>
                  <Select
                    value={field.value ? String(field.value) : undefined}
                    onValueChange={(v) => field.onChange(Number(v))}
                  >
                    <SelectTrigger id="grade-level">
                      <SelectValue placeholder="Selecciona nivel" />
                    </SelectTrigger>
                    <SelectContent>
                      {(levels.data?.content ?? []).map((l) => (
                        <SelectItem key={l.id} value={String(l.id)}>
                          {l.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {form.formState.errors.levelId ? (
                    <FieldError>{form.formState.errors.levelId.message}</FieldError>
                  ) : null}
                </Field>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
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
        title="Eliminar grado"
        description={deleting ? `"${deleting.name}" sera eliminado.` : undefined}
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
