import { useMemo } from "react"
import { createFileRoute, redirect } from "@tanstack/react-router"
import { Loader2Icon } from "lucide-react"

import { useAuthStore } from "@/features/auth/store/authStore"
import { isRole } from "@/features/auth/types"
import { useCurrentContext } from "@/features/auth/hooks/useCurrentContext"
import { useCourseStudents } from "@/features/courses/hooks/useCourses"
import { EnrollStudentDialog } from "@/features/students/components/EnrollStudentDialog"
import { StudentsTable } from "@/features/students/components/StudentsTable"
import type { StudentRow } from "@/features/students/types"

export const Route = createFileRoute("/_app/students")({
  beforeLoad: () => {
    const role = useAuthStore.getState().role
    if (!isRole(role, "TEACHER")) {
      throw redirect({ to: "/dashboard" })
    }
  },
  component: StudentsPage,
})

/**
 * El curso entero de una sola vez.
 *
 * Constante de módulo y no un literal en la llamada: es la clave con la que react-query cachea,
 * y esta pantalla no pagina — lista el curso, y un curso entra.
 */
const WHOLE_COURSE = { offset: 1, limit: 200, sort: "asc" as const }

function StudentsPage() {
  const { homeroomCourseId, isLoading } = useCurrentContext()
  const studentsQuery = useCourseStudents(homeroomCourseId, WHOLE_COURSE)

  const rows = useMemo<StudentRow[]>(
    () =>
      (studentsQuery.data?.content ?? []).map((s) => ({
        courseEnrollmentId: s.courseEnrollmentId,
        rudeCode: s.rudeCode,
        identityCard: s.identityCard,
        fullName: s.fullName,
        status: s.status,
      })),
    [studentsQuery.data]
  )

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <div className="flex items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold">Estudiantes</h1>
          <p className="text-sm text-muted-foreground">
            Padrón del curso de aula — gestión 2026.
          </p>
        </div>
        <EnrollStudentDialog courseId={homeroomCourseId} />
      </div>

      {isLoading || studentsQuery.isLoading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2Icon className="size-4 animate-spin" />
          Cargando estudiantes...
        </div>
      ) : !homeroomCourseId ? (
        <div className="rounded-md border border-dashed p-12 text-center text-muted-foreground">
          Como docente técnico no tienes un curso de aula. El padrón es del
          docente de aula.
        </div>
      ) : (
        <StudentsTable
          data={rows}
          pageSize={10}
          isFetching={studentsQuery.isFetching}
          onRefresh={() => void studentsQuery.refetch()}
        />
      )}
    </div>
  )
}
