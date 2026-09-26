import { createFileRoute } from "@tanstack/react-router"

import { useCurrentContext } from "@/features/auth/hooks/useCurrentContext"
import { useAcademicYears } from "@/features/catalog/hooks/useCatalog"
import { DashboardCharts } from "@/features/gradebook/components/DashboardCharts"
import { DirectorDashboardCharts } from "@/features/gradebook/components/DirectorDashboardCharts"
import { SecretaryDashboardCharts } from "@/features/students/components/SecretaryDashboardCharts"

export const Route = createFileRoute("/_app/dashboard")({
  component: DashboardPage,
})

/**
 * El aviso de la página entera, que no es el de una tarjeta.
 *
 * Ocupa el lugar del tablero completo, así que lleva el recuadro punteado; `QueryState` rotula el
 * hueco de un gráfico dentro de una tarjeta que ya tiene borde propio.
 */
interface PageNoticeProps {
  children: string
}

function PageNotice({ children }: PageNoticeProps) {
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
          <PageNotice>
            Docente técnico: sin curso de aula. Indicadores por materia en
            desarrollo.
          </PageNotice>
        ))}

      {(isDirector || isSecretary) &&
        (academicYearId === null ? (
          <PageNotice>
            Sin gestión registrada. Los indicadores se calculan sobre una
            gestión.
          </PageNotice>
        ) : isDirector ? (
          <DirectorDashboardCharts academicYearId={academicYearId} />
        ) : (
          <SecretaryDashboardCharts academicYearId={academicYearId} />
        ))}
    </div>
  )
}
