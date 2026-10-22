import { createFileRoute } from "@tanstack/react-router"

import { NoHomeroomCourseNotice } from "@/components/shared/NoHomeroomCourseNotice"
import { useCurrentContext } from "@/features/auth/hooks/useCurrentContext"
import { activeAcademicYear } from "@/features/catalog/utils/activeAcademicYear"
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
  const { isTeacher, isTechnical, isDirector, isSecretary, homeroomCourseId } =
    useCurrentContext()

  // La gestión actual es la activa (`activeAcademicYear`), no la más reciente.
  // Va el `id`, la clave SERIAL de la fila, y no el `year` calendario — los dos son números y
  // mandar el equivocado no falla, responde por otra gestión.
  const years = useAcademicYears()
  const academicYearId = activeAcademicYear(years.data)?.id ?? null

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Resumen pedagógico de la Unidad Educativa.
        </p>
      </div>

      {isTeacher &&
        (isTechnical ? (
          <PageNotice>
            Docente técnico: sin curso de aula. Indicadores por materia en
            desarrollo.
          </PageNotice>
        ) : homeroomCourseId ? (
          <DashboardCharts courseId={homeroomCourseId} />
        ) : (
          <NoHomeroomCourseNotice whatYouWillSee="los indicadores del curso" />
        ))}

      {(isDirector || isSecretary) &&
        (academicYearId === null ? (
          <PageNotice>
            Sin gestión activa. Los indicadores se calculan sobre la gestión en
            curso.
          </PageNotice>
        ) : isDirector ? (
          <DirectorDashboardCharts academicYearId={academicYearId} />
        ) : (
          <SecretaryDashboardCharts academicYearId={academicYearId} />
        ))}
    </div>
  )
}
