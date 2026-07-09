import { useMemo, useState } from "react"
import { createFileRoute, redirect } from "@tanstack/react-router"
import {
  CheckCircle2Icon,
  MessageSquareWarningIcon,
  PencilIcon,
  PlusIcon,
  SendIcon,
  Trash2Icon,
  TrendingUpIcon,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"
import { ConfirmDialog } from "@/components/shared/ConfirmDialog"
import { DataTablePagination } from "@/components/shared/DataTablePagination"
import { useAuthStore } from "@/features/auth/store/authStore"
import { isRole } from "@/features/auth/types"
import { useTeacherClassGroups } from "@/features/courses/hooks/useCourses"
import { useSendNotification } from "@/features/notifications/hooks/useNotifications"
import { PdcFormDialog } from "@/features/pdc/components/PdcFormDialog"
import { PdcProgressDialog } from "@/features/pdc/components/PdcProgressDialog"
import { usePdcAction, usePdcList } from "@/features/pdc/hooks/usePdc"
import { STATUS_BADGE, type Pdc } from "@/features/pdc/types"

export const Route = createFileRoute("/_app/pdc")({
  beforeLoad: () => {
    const role = useAuthStore.getState().role
    if (!isRole(role, "TEACHER") && !isRole(role, "DIRECTOR")) {
      throw redirect({ to: "/dashboard" })
    }
  },
  component: PdcPage,
})

function PdcPage() {
  const role = useAuthStore((s) => s.role)
  const userId = useAuthStore((s) => s.userId)
  const isTeacher = isRole(role, "TEACHER")
  const isDirector = isRole(role, "DIRECTOR")

  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Pdc | null>(null)
  const [deleting, setDeleting] = useState<Pdc | null>(null)
  const [observing, setObserving] = useState<Pdc | null>(null)
  const [observation, setObservation] = useState("")
  const [progress, setProgress] = useState<Pdc | null>(null)

  const classGroupsQuery = useTeacherClassGroups(isTeacher ? userId : null)
  const { data, isLoading, isFetching, refetch } = usePdcList({ offset: page, limit })
  const { publish, approve, observe, remove } = usePdcAction()
  const sendNotification = useSendNotification()

  // Director acts → notify the PDC owner (teacher), receiver = createdById.
  const notifyOwner = (pdc: Pdc, message: string) => {
    if (!pdc.createdById) return
    sendNotification.mutate({ receiver_id: pdc.createdById, message })
  }

  // Backend list devuelve todos; el docente solo ve los suyos (createdById).
  const rows = useMemo(() => {
    const all = data?.content ?? []
    if (isTeacher && userId) return all.filter((p) => p.createdById === userId)
    return all
  }, [data, isTeacher, userId])
  const subjects = (classGroupsQuery.data ?? []).map((cg) => ({
    subjectId: cg.subjectId,
    subjectName: cg.subjectName,
    classGroupId: cg.id,
  }))

  const openCreate = () => {
    setEditing(null)
    setFormOpen(true)
  }
  const openEdit = (p: Pdc) => {
    setEditing(p)
    setFormOpen(true)
  }

  const canEdit = (s: string) => s === "Draft" || s === "With Observations"

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <div className="flex items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold">Plan de Desarrollo Curricular</h1>
          <p className="text-sm text-muted-foreground">
            {isDirector
              ? "Revisa, aprueba u observa los PDC de los docentes."
              : "Crea y publica tu PDC por materia y trimestre."}
          </p>
        </div>
        {isTeacher ? (
          <Button
            className="bg-univalle text-univalle-foreground hover:bg-univalle/90"
            onClick={openCreate}
          >
            <PlusIcon data-icon="inline-start" />
            Nuevo PDC
          </Button>
        ) : null}
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Titulo</TableHead>
              <TableHead>Materia</TableHead>
              <TableHead>Trim.</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  Cargando…
                </TableCell>
              </TableRow>
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  Sin PDC.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.title}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {p.subjectName}
                  </TableCell>
                  <TableCell>{p.trimester}</TableCell>
                  <TableCell>
                    <Badge
                      className={cn(
                        STATUS_BADGE[p.status] ?? "bg-muted text-muted-foreground",
                      )}
                    >
                      {p.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      {isTeacher ? (
                        <Button
                          size="icon"
                          variant="ghost"
                          className="size-8"
                          title="Avance"
                          onClick={() => setProgress(p)}
                        >
                          <TrendingUpIcon className="size-4" />
                        </Button>
                      ) : null}
                      {isTeacher && canEdit(p.status) ? (
                        <Button
                          size="icon"
                          variant="ghost"
                          className="size-8"
                          title="Editar"
                          onClick={() => openEdit(p)}
                        >
                          <PencilIcon className="size-4" />
                        </Button>
                      ) : null}
                      {isTeacher && canEdit(p.status) ? (
                        <Button
                          size="icon"
                          variant="ghost"
                          className="size-8"
                          title="Publicar"
                          disabled={publish.isPending}
                          onClick={() => publish.mutate(p.id)}
                        >
                          <SendIcon className="size-4" />
                        </Button>
                      ) : null}
                      {isTeacher && p.status === "Draft" ? (
                        <Button
                          size="icon"
                          variant="ghost"
                          className="size-8 text-destructive"
                          title="Eliminar"
                          onClick={() => setDeleting(p)}
                        >
                          <Trash2Icon className="size-4" />
                        </Button>
                      ) : null}
                      {isDirector &&
                      (p.status === "Published" || p.status === "Under Review") ? (
                        <>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="size-8 text-emerald-600"
                            title="Aprobar"
                            disabled={approve.isPending}
                            onClick={() =>
                              approve.mutate(p.id, {
                                onSuccess: () =>
                                  notifyOwner(
                                    p,
                                    `Tu PDC "${p.title}" fue aprobado.`,
                                  ),
                              })
                            }
                          >
                            <CheckCircle2Icon className="size-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="size-8 text-amber-600"
                            title="Observar"
                            onClick={() => {
                              setObserving(p)
                              setObservation("")
                            }}
                          >
                            <MessageSquareWarningIcon className="size-4" />
                          </Button>
                        </>
                      ) : null}
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

      {isTeacher ? (
        <PdcFormDialog
          open={formOpen}
          editing={editing}
          subjects={subjects}
          onClose={() => setFormOpen(false)}
        />
      ) : null}

      <PdcProgressDialog pdc={progress} onClose={() => setProgress(null)} />

      <ConfirmDialog
        open={Boolean(deleting)}
        title="Eliminar PDC"
        description={deleting ? `"${deleting.title}" sera eliminado.` : undefined}
        confirmLabel="Eliminar"
        destructive
        loading={remove.isPending}
        onConfirm={() => {
          if (!deleting) return
          remove.mutate(deleting.id, { onSuccess: () => setDeleting(null) })
        }}
        onOpenChange={(o) => !o && setDeleting(null)}
      />

      <Dialog
        open={Boolean(observing)}
        onOpenChange={(o) => !o && setObserving(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Observar PDC</DialogTitle>
          </DialogHeader>
          <Textarea
            rows={4}
            placeholder="Describe las observaciones…"
            value={observation}
            onChange={(e) => setObservation(e.target.value)}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setObserving(null)}>
              Cancelar
            </Button>
            <Button
              className="bg-univalle text-univalle-foreground hover:bg-univalle/90"
              disabled={!observation.trim() || observe.isPending}
              onClick={() => {
                if (!observing) return
                const target = observing
                const obs = observation.trim()
                observe.mutate(
                  { id: target.id, observations: obs },
                  {
                    onSuccess: () => {
                      notifyOwner(
                        target,
                        `Tu PDC "${target.title}" fue observado: ${obs}`,
                      )
                      setObserving(null)
                    },
                  },
                )
              }}
            >
              Enviar observacion
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
