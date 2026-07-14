import { useMemo, useState } from "react"
import { createFileRoute, redirect } from "@tanstack/react-router"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { PencilIcon, PlusIcon, Trash2Icon } from "lucide-react"

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
  useCreateSubject,
  useDeleteSubject,
  useSubjectsAdmin,
  useUpdateSubject,
} from "@/features/academic/hooks/useAcademic"
import type { Subject } from "@/features/academic/types"

export const Route = createFileRoute("/_app/subjects")({
  beforeLoad: () => {
    if (!isRole(useAuthStore.getState().role, "DIRECTOR")) {
      throw redirect({ to: "/dashboard" })
    }
  },
  component: SubjectsPage,
})

const schema = z.object({
  name: trimmedString({ min: 1, max: 100, field: "Nombre" }),
  technical: z.boolean(),
})
type FormValues = z.infer<typeof schema>

function SubjectsPage() {
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Subject | null>(null)
  const [deleting, setDeleting] = useState<Subject | null>(null)

  const query = useMemo<PageQuery>(
    () => ({ offset: page, limit, sort: "asc" }),
    [page, limit],
  )
  const { data, isLoading, isFetching, refetch } = useSubjectsAdmin(query)
  const create = useCreateSubject()
  const update = useUpdateSubject()
  const remove = useDeleteSubject()

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", technical: false },
  })

  const openCreate = () => {
    setEditing(null)
    form.reset({ name: "", technical: false })
    setDialogOpen(true)
  }
  const openEdit = (s: Subject) => {
    setEditing(s)
    form.reset({ name: s.name, technical: s.technical })
    setDialogOpen(true)
  }

  const onSubmit = form.handleSubmit(async (v) => {
    try {
      if (editing) {
        await update.mutateAsync({
          id: editing.id,
          name: v.name,
          technical: v.technical,
        })
      } else {
        await create.mutateAsync({ name: v.name, technical: v.technical })
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
            Materias / areas curriculares.
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

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Materia</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground">
                  Cargando…
                </TableCell>
              </TableRow>
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground">
                  Sin materias.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((s) => (
                <TableRow key={s.id}>
                  <TableCell>{s.name}</TableCell>
                  <TableCell>
                    <Badge
                      className={
                        s.technical
                          ? "bg-amber-500/20 text-amber-700 dark:text-amber-300"
                          : "bg-muted text-muted-foreground"
                      }
                    >
                      {s.technical ? "Técnica" : "Aula"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={s.active ? "secondary" : "outline"}>
                      {s.active ? "Activa" : "Inactiva"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="size-8"
                        onClick={() => openEdit(s)}
                      >
                        <PencilIcon className="size-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="size-8 text-destructive"
                        onClick={() => setDeleting(s)}
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
            <DialogTitle>{editing ? "Editar materia" : "Nueva materia"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
            <Field data-invalid={Boolean(form.formState.errors.name) || undefined}>
              <FieldLabel htmlFor="subject-name">Nombre</FieldLabel>
              <Input id="subject-name" {...form.register("name")} />
              {form.formState.errors.name ? (
                <FieldError>{form.formState.errors.name.message}</FieldError>
              ) : null}
            </Field>
            <Field orientation="horizontal">
              <Checkbox
                id="subject-technical"
                checked={form.watch("technical")}
                onCheckedChange={(v) =>
                  form.setValue("technical", Boolean(v))
                }
              />
              <FieldLabel htmlFor="subject-technical" className="font-normal">
                Materia técnica (Música / Religión — la dicta un docente técnico)
              </FieldLabel>
            </Field>
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
        title="Eliminar materia"
        description={deleting ? `"${deleting.name}" sera desactivada.` : undefined}
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
