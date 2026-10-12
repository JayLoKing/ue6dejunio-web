import { useState } from "react"
import { useIsMutating } from "@tanstack/react-query"
import {
  CircleCheckIcon,
  CopyIcon,
  LockIcon,
  LockOpenIcon,
  PowerIcon,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ConfirmDialog } from "@/components/shared/ConfirmDialog"
import { useAuthStore } from "@/features/auth/store/authStore"
import { coursePermissions } from "@/features/courses/utils/coursePermissions"
import { useAcademicYears } from "@/features/catalog/hooks/useCatalog"
import type { AcademicYearItem } from "@/features/catalog/types"

import {
  useActivateAcademicYear,
  useCloseAcademicYear,
  useReopenAcademicYear,
} from "../hooks/useAcademicYearMutations"
import {
  canActivate,
  canClose,
  canDuplicate,
  canReopen,
} from "../utils/yearActions"
import { DuplicateStructureDialog } from "./DuplicateStructureDialog"

interface Pending {
  kind: "close" | "reopen"
  year: AcademicYearItem
}

const COLUMNS = 3

/**
 * Only one year is active and every screen reads from it, so its row has to be found at a
 * glance: a primary tint (stronger in dark mode, where 10% over black disappears) and a
 * left rule. The others only mute their year: dimming the whole row would also dim the
 * actions, and those stay as legible as on the active row.
 */
const ROW_ACTIVE =
  "bg-primary/10 shadow-[inset_3px_0_0_var(--primary)] hover:bg-primary/15 dark:bg-primary/15 dark:hover:bg-primary/20"

export function AcademicYearsTable() {
  const { canManageYears, canDuplicateStructure } = coursePermissions(
    useAuthStore((s) => s.role)
  )
  const { data, isLoading, isError } = useAcademicYears()
  const activate = useActivateAcademicYear()
  const close = useCloseAcademicYear()
  const reopen = useReopenAcademicYear()
  const [pending, setPending] = useState<Pending | null>(null)
  const [duplicating, setDuplicating] = useState<AcademicYearItem | null>(null)

  // Any mutation in the page, the header's "Nueva gestión" and the duplication included.
  const busy = useIsMutating() > 0
  const years = data ?? []

  const confirm = () => {
    if (!pending) return
    const mutation = pending.kind === "close" ? close : reopen
    mutation.mutate(pending.year.id, { onSuccess: () => setPending(null) })
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Gestión</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <MessageRow>Cargando...</MessageRow>
          ) : isError ? (
            // A failed fetch must not read as "no years": say it failed.
            <MessageRow>No se pudieron cargar las gestiones.</MessageRow>
          ) : years.length === 0 ? (
            <MessageRow>Sin gestiones registradas.</MessageRow>
          ) : (
            years.map((year) => (
              <TableRow
                key={year.id}
                data-active={year.active}
                className={year.active ? ROW_ACTIVE : undefined}
              >
                <TableCell
                  className={cn(
                    "font-medium",
                    year.active ? "font-semibold" : "text-muted-foreground"
                  )}
                >
                  {year.year}
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    {year.active ? (
                      <Badge>
                        <CircleCheckIcon data-icon="inline-start" />
                        Activa
                      </Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className="text-muted-foreground"
                      >
                        Inactiva
                      </Badge>
                    )}
                    <Badge variant={year.closed ? "outline" : "secondary"}>
                      {year.closed ? "Cerrada" : "Abierta"}
                    </Badge>
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    {canManageYears ? (
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={busy || !canActivate(year)}
                        onClick={() => activate.mutate(year.id)}
                      >
                        <PowerIcon data-icon="inline-start" />
                        Activar
                      </Button>
                    ) : null}
                    {canDuplicateStructure ? (
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={busy || !canDuplicate(year)}
                        onClick={() => setDuplicating(year)}
                      >
                        <CopyIcon data-icon="inline-start" />
                        Duplicar estructura
                      </Button>
                    ) : null}
                    {canManageYears ? (
                      <>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive"
                          disabled={busy || !canClose(year)}
                          onClick={() => setPending({ kind: "close", year })}
                        >
                          <LockIcon data-icon="inline-start" />
                          Cerrar
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={busy || !canReopen(year)}
                          onClick={() => setPending({ kind: "reopen", year })}
                        >
                          <LockOpenIcon data-icon="inline-start" />
                          Reabrir
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

      <ConfirmDialog
        open={pending !== null}
        title={
          pending?.kind === "reopen"
            ? `Reabrir la gestión ${pending.year.year}`
            : `Cerrar la gestión ${pending?.year.year ?? ""}`
        }
        description={pending ? warningFor(pending) : undefined}
        confirmLabel={
          pending?.kind === "reopen" ? "Reabrir gestión" : "Cerrar gestión"
        }
        destructive={pending?.kind === "close"}
        loading={busy}
        onConfirm={confirm}
        onOpenChange={(open) => !open && setPending(null)}
      />

      <DuplicateStructureDialog
        target={duplicating}
        years={years}
        onClose={() => setDuplicating(null)}
      />
    </div>
  )
}

function MessageRow({ children }: { children: string }) {
  return (
    <TableRow>
      <TableCell
        colSpan={COLUMNS}
        className="text-center text-muted-foreground"
      >
        {children}
      </TableCell>
    </TableRow>
  )
}

function warningFor({ kind, year }: Pending): string {
  if (kind === "reopen") {
    return `La gestión ${year.year} volverá a admitir cambios. Los promedios y resultados finales congelados se conservan hasta que la vuelvas a cerrar, y la gestión no se activa sola.`
  }
  const base = `Al cerrar la gestión ${year.year} se congelan el promedio final y el resultado de cada estudiante, y se bloquean las notas, la asistencia, los planes y demás registros de esa gestión. Podrás reabrirla más adelante.`
  return year.active
    ? `${base} Es la gestión activa: ninguna gestión quedará activa hasta que actives otra.`
    : base
}
