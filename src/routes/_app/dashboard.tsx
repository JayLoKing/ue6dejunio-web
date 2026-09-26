import { createFileRoute } from "@tanstack/react-router"

import { useCurrentContext } from "@/features/auth/hooks/useCurrentContext"
import { useAcademicYears } from "@/features/catalog/hooks/useCatalog"
import { DashboardCharts } from "@/features/gradebook/components/DashboardCharts"
import { DirectorDashboardCharts } from "@/features/gradebook/components/DirectorDashboardCharts"
import { SecretaryDashboardCharts } from "@/features/students/components/SecretaryDashboardCharts"

export const Route = createFileRoute("/_app/dashboard")({
  component: DashboardPage,
})

function Notice({ children }: { children: string }) {
  return (
    <div className="rounded-md border border-dashed p-12 text-center text-muted-foreground">
      {children}
    </div>
  )
}

function DashboardPage() {
  const { isTeacher, isDirector, isSecretary, homeroomCourseId } =
    useCurrentContext()

  // La gestión actual es la primera: el catálogo las devuelve de la más reciente a la más antigua.
  // Va el `id`, la clave SERIAL de la fila, y no el `year` calendario — los dos son números y
  // mandar el equivocado no falla, responde por otra gestión.
  const years = useAcademicYears()
  const academicYearId = years.data?.[0]?.id ?? null

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Resumen pedagógico de la Unidad Educativa.
        </p>
      </div>

      {isTeacher &&
        (homeroomCourseId ? (
          <DashboardCharts courseId={homeroomCourseId} />
        ) : (
          <Notice>
            Docente técnico: sin curso de aula. Indicadores por materia en
            desarrollo.
          </Notice>
        ))}

      {(isDirector || isSecretary) &&
        (academicYearId === null ? (
          <Notice>
            Sin gestión registrada. Los indicadores se calculan sobre una
            gestión.
          </Notice>
        ) : isDirector ? (
          <DirectorDashboardCharts academicYearId={academicYearId} />
        ) : (
          <SecretaryDashboardCharts academicYearId={academicYearId} />
        ))}
    </div>
  )
}
