import { useMemo, useState } from "react"
import { Loader2Icon } from "lucide-react"

import { useAuthStore } from "@/features/auth/store/authStore"
import { isRole } from "@/features/auth/types"
import { DEFAULT_PAGE_QUERY } from "@/lib/types/pagination"

import { StudentDirectoryTable } from "./StudentDirectoryTable"
import { StudentWithdrawalDialog } from "./StudentWithdrawalDialog"
import {
  WithdrawStudentDialog,
  type WithdrawalTarget,
} from "./WithdrawStudentDialog"
import { useStudentDirectory } from "../hooks/useStudentDirectory"
import { EMPTY_DIRECTORY_FILTERS } from "../types"

export interface CourseStudentsPanelProps {
  courseId: string
}

/**
 * El padrón de un curso, con la baja al alcance de quien la decide.
 *
 * Alcance `ALL` y no `ACTIVE`: quien deja el curso sigue apareciendo con su motivo a mano, igual
 * que en el padrón del docente. Una fila que desaparece sin dejar rastro deja al curso explicando
 * por qué son menos que ayer.
 *
 * Sin filtros propios: el curso ya acota grado, paralelo y gestión — un curso pertenece a una sola.
 */
export function CourseStudentsPanel({ courseId }: CourseStudentsPanelProps) {
  const role = useAuthStore((s) => s.role)
  const canWithdraw = isRole(role, "DIRECTOR")

  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_QUERY.limit)
  const [withdrawing, setWithdrawing] = useState<WithdrawalTarget | null>(null)
  const [readingReason, setReadingReason] = useState<string | null>(null)

  const filters = useMemo(
    () => ({ ...EMPTY_DIRECTORY_FILTERS, courseId, scope: "ALL" as const }),
    [courseId]
  )

  const roster = useStudentDirectory(filters, {
    offset: page,
    limit: pageSize,
    sort: DEFAULT_PAGE_QUERY.sort,
  })

  if (roster.isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2Icon className="size-4 animate-spin" />
        Cargando estudiantes...
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <StudentDirectoryTable
        rows={roster.data?.content ?? []}
        page={page}
        pageSize={pageSize}
        total={roster.data?.total ?? 0}
        totalPages={roster.data?.totalPages ?? 1}
        isFetching={roster.isFetching}
        onRefresh={() => void roster.refetch()}
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
