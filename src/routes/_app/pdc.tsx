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
import { PdcCreateDialog } from "@/features/pdc/components/PdcCreateDialog"
import { PdcWizard } from "@/features/pdc/components/PdcWizard"
import { planLabel } from "@/features/pdc/utils/planLabel"
import {
  isEditable,
  STATUS_BADGE,
  STATUS_LABEL,
} from "@/features/pdc/utils/status"
import { PdcProgressDialog } from "@/features/pdc/components/PdcProgressDialog"
import { usePdcAction, usePdcList } from "@/features/pdc/hooks/usePdc"
import type { Pdc } from "@/features/pdc/types"

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
  const [creating, setCreating] = useState(false)
  // The plan being walked through step by step. Null closes the wizard back to the listing.
  const [editingId, setEditingId] = useState<string | null>(null)
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

  // The backend already scopes a teacher to the plans they take part in — the course they run or a
  // subject they teach in it. Filtering again on createdById here hid the rotation from the people
  // it is for: a copy is authored by whoever triggered it, so every parallel's plan carried the
  // first teacher's id and vanished from the list of the teacher it was handed to.
  const rows = data?.content ?? []
  // The plan is opened for a course, not for a subject, so the picker offers the courses the
  // teacher runs — deduplicated, because a teacher with several subjects in one course still
  // plans that course once.
  const courses = useMemo(() => {
    const byId = new Map<string, string>()
    for (const cg of classGroupsQuery.data ?? []) {
      if (!byId.has(cg.courseId)) {
        byId.set(cg.courseId, `${cg.gradeName} "${cg.parallelName}"`)
      }
    }
    return [...byId].map(([id, name]) => ({ id, name }))
  }, [classGroupsQuery.data])

  const openCreate = () => setCreating(true)
  const openEdit = (p: Pdc) => setEditingId(p.id)

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
              <TableHead>Título</TableHead>
              {/* Only the Director reads other people's plans; a teacher's list is all their own. */}
              {isDirector ? <TableHead>Docente</TableHead> : null}
              <TableHead>Trim.</TableHead>
              {/* How wide the month is, and how much of it answers to a named student. Both say
                  whether a plan is worth opening before it is opened. */}
              <TableHead className="text-right">Áreas</TableHead>
              <TableHead className="text-right">Adapt. signif.</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={isDirector ? 7 : 6} className="text-center text-muted-foreground">
                  Cargando…
                </TableCell>
              </TableRow>
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={isDirector ? 7 : 6} className="text-center text-muted-foreground">
                  Sin PDC.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{planLabel(p)}</TableCell>
                  {isDirector ? (
                    <TableCell className="text-muted-foreground">
                      {p.homeroomTeacherName ?? "—"}
                    </TableCell>
                  ) : null}
                  <TableCell>{p.trimester}</TableCell>
                  <TableCell className="text-right tabular-nums">{p.areaCount}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {p.significantAdaptationCount}
                  </TableCell>
                  <TableCell>
                    <Badge className={cn(STATUS_BADGE[p.status])}>
                      {STATUS_LABEL[p.status]}
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
                      {isTeacher && isEditable(p.status) ? (
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
                      {isTeacher && isEditable(p.status) ? (
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
                                    `Tu PDC "${planLabel(p)}" fue aprobado.`,
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
        <PdcCreateDialog
          open={creating}
          courses={courses}
          onClose={() => setCreating(false)}
          onCreated={(plan) => {
            setCreating(false)
            // Straight into the steps: the plan exists only so its subject blocks can be filled.
            setEditingId(plan.id)
          }}
        />
      ) : null}

      <Dialog
        open={Boolean(editingId)}
        onOpenChange={(o) => !o && setEditingId(null)}
      >
        <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-[95vw]">
          <DialogHeader>
            <DialogTitle>Plan de Desarrollo Curricular</DialogTitle>
          </DialogHeader>
          {editingId ? (
            <PdcWizard planId={editingId} onClose={() => setEditingId(null)} />
          ) : null}
        </DialogContent>
      </Dialog>

      <PdcProgressDialog pdc={progress} onClose={() => setProgress(null)} />

      <ConfirmDialog
        open={Boolean(deleting)}
        title="Eliminar PDC"
        description={deleting ? `"${planLabel(deleting)}" será eliminado.` : undefined}
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
                        `Tu PDC "${planLabel(target)}" fue observado: ${obs}`,
                      )
                      setObserving(null)
                    },
                  },
                )
              }}
            >
              Enviar observación
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
