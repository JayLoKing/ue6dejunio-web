import { useMemo, useState } from "react"
import { createFileRoute, redirect } from "@tanstack/react-router"
import { Loader2Icon } from "lucide-react"

import { useAuthStore } from "@/features/auth/store/authStore"
import { isRole } from "@/features/auth/types"
import { StudentDirectoryFilters as DirectoryFilters } from "@/features/students/components/StudentDirectoryFilters"
import { StudentDirectoryTable } from "@/features/students/components/StudentDirectoryTable"
import { StudentWithdrawalDialog } from "@/features/students/components/StudentWithdrawalDialog"
import {
  WithdrawStudentDialog,
  type WithdrawalTarget,
} from "@/features/students/components/WithdrawStudentDialog"
import { useStudentDirectory } from "@/features/students/hooks/useStudentDirectory"
import {
  EMPTY_DIRECTORY_FILTERS,
  type StudentDirectoryFilters,
} from "@/features/students/types"
import { useDebouncedValue } from "@/lib/hooks/useDebouncedValue"
import { DEFAULT_PAGE_QUERY } from "@/lib/types/pagination"

export const Route = createFileRoute("/_app/estudiantes")({
  beforeLoad: () => {
    const role = useAuthStore.getState().role
    // La ruta la comparten Dirección y secretaría; el docente tiene su propio padrón en /students.
    if (!isRole(role, "DIRECTOR") && !isRole(role, "SECRETARY")) {
      throw redirect({ to: "/dashboard" })
    }
  },
  component: StudentDirectoryPage,
})

function StudentDirectoryPage() {
  const role = useAuthStore((s) => s.role)
  const canWithdraw = isRole(role, "DIRECTOR")

  const [filters, setFilters] = useState<StudentDirectoryFilters>(
    EMPTY_DIRECTORY_FILTERS
  )
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_QUERY.limit)

  // Lo tipeado se manda tarde; lo elegido en un select, ya. Un debounce sobre los selects sólo
  // haría esperar por una elección que no va a seguir cambiando letra por letra.
  const debouncedQ = useDebouncedValue(filters.q, 300)
  const applied = useMemo<StudentDirectoryFilters>(
    () => ({ ...filters, q: debouncedQ }),
    [filters, debouncedQ]
  )

  const directory = useStudentDirectory(applied, {
    offset: page,
    limit: pageSize,
    sort: DEFAULT_PAGE_QUERY.sort,
  })

  /** Cambiar un filtro devuelve a la primera página: la cuarta de otro filtro no es la cuarta. */
  const changeFilters = (next: StudentDirectoryFilters) => {
    setFilters(next)
    setPage(1)
  }

  // La baja que se está por hacer, y la baja ya hecha que se está leyendo. Son dos preguntas
  // distintas sobre la misma fila, y cada una tiene su diálogo.
  const [withdrawing, setWithdrawing] = useState<WithdrawalTarget | null>(null)
  const [readingReason, setReadingReason] = useState<string | null>(null)

  const rows = directory.data?.content ?? []

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">Estudiantes</h1>
        <p className="text-sm text-muted-foreground">
          Todos los estudiantes de la institución. El listado habla de una
          gestión a la vez.
        </p>
      </div>

      <DirectoryFilters value={filters} onChange={changeFilters} />

      {directory.isLoading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2Icon className="size-4 animate-spin" />
          Cargando estudiantes...
        </div>
      ) : (
        <StudentDirectoryTable
          rows={rows}
          page={page}
          pageSize={pageSize}
          total={directory.data?.total ?? 0}
          totalPages={directory.data?.totalPages ?? 1}
          isFetching={directory.isFetching}
          onRefresh={() => void directory.refetch()}
          onPageChange={setPage}
          onPageSizeChange={(s) => {
            setPageSize(s)
            setPage(1)
          }}
          onOpenWithdrawal={setReadingReason}
          onWithdraw={
            canWithdraw
              ? (s) => setWithdrawing({ id: s.id, fullName: s.fullName })
              : undefined
          }
        />
      )}

      <WithdrawStudentDialog
        student={withdrawing}
        onClose={() => setWithdrawing(null)}
      />
      <StudentWithdrawalDialog
        studentId={readingReason}
        onClose={() => setReadingReason(null)}
      />
    </div>
  )
}
