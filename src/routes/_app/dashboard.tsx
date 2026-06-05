import { createFileRoute } from "@tanstack/react-router"

import { useAuthStore } from "@/features/auth/store/authStore"
import { isRole } from "@/features/auth/types"
import { useTeacherSubjects } from "@/features/students/hooks/useTeacherStudents"
import { DashboardCharts } from "@/features/gradebook/components/DashboardCharts"

export const Route = createFileRoute("/_app/dashboard")({
  component: DashboardPage,
})

function DashboardPage() {
  const role = useAuthStore((s) => s.role)
  const userId = useAuthStore((s) => s.userId)
  const teacher = isRole(role, "TEACHER")
  const { data: subjects } = useTeacherSubjects(teacher ? userId : null)

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Resumen pedagogico de la Unidad Educativa.
        </p>
      </div>

      {teacher ? (
        <DashboardCharts subjects={subjects ?? []} />
      ) : (
        <div className="rounded-md border border-dashed p-12 text-center text-muted-foreground">
          Indicadores institucionales — en desarrollo.
        </div>
      )}
    </div>
  )
}
