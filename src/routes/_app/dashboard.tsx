import { createFileRoute } from "@tanstack/react-router"

import { useCurrentContext } from "@/features/auth/hooks/useCurrentContext"
import { DashboardCharts } from "@/features/gradebook/components/DashboardCharts"

export const Route = createFileRoute("/_app/dashboard")({
  component: DashboardPage,
})

function DashboardPage() {
  const { isTeacher, homeroomCourseId } = useCurrentContext()

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Resumen pedagogico de la Unidad Educativa.
        </p>
      </div>

      {isTeacher && homeroomCourseId ? (
        <DashboardCharts courseId={homeroomCourseId} />
      ) : (
        <div className="rounded-md border border-dashed p-12 text-center text-muted-foreground">
          {isTeacher
            ? "Docente tecnico: sin curso de aula. Indicadores por materia en desarrollo."
            : "Indicadores institucionales — en desarrollo."}
        </div>
      )}
    </div>
  )
}
