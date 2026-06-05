import { useMemo } from "react"
import { createFileRoute, redirect } from "@tanstack/react-router"
import { Loader2Icon } from "lucide-react"

import { useAuthStore } from "@/features/auth/store/authStore"
import { isRole } from "@/features/auth/types"
import { EnrollStudentDialog } from "@/features/students/components/EnrollStudentDialog"
import {
  StudentsTable,
  type StudentRow,
} from "@/features/students/components/StudentsTable"
import { useTeacherStudents } from "@/features/students/hooks/useTeacherStudents"
import type { Gender } from "@/features/students/types"

export const Route = createFileRoute("/_app/students")({
  beforeLoad: () => {
    const role = useAuthStore.getState().role
    if (!isRole(role, "TEACHER")) {
      throw redirect({ to: "/dashboard" })
    }
  },
  component: StudentsPage,
})

function StudentsPage() {
  const userId = useAuthStore((s) => s.userId)
  const studentsQuery = useTeacherStudents(userId, {
    offset: 1,
    limit: 200,
    sort: "asc",
  })

  const rows = useMemo<StudentRow[]>(() => {
    return (studentsQuery.data?.content ?? []).map((s) => ({
      id: s.id,
      rudeCode: s.rudeCode,
      identityCard: s.identityCard,
      lastNames: s.lastNames,
      names: s.names,
      birthDate: s.birthDate,
      gender: s.gender as Gender,
      subjects: s.enrollments.map((e) => e.subjectName),
    }))
  }, [studentsQuery.data])

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <div className="flex items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold">Estudiantes</h1>
          <p className="text-sm text-muted-foreground">
            Padron inscritos por curso — gestion 2026.
          </p>
        </div>
        <EnrollStudentDialog />
      </div>

      {studentsQuery.isLoading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2Icon className="size-4 animate-spin" />
          Cargando estudiantes...
        </div>
      ) : studentsQuery.isError ? (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          Error al cargar estudiantes.
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
