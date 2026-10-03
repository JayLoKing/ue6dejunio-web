import { createFileRoute, redirect } from "@tanstack/react-router"

import { useAuthStore } from "@/features/auth/store/authStore"
import { coursePermissions } from "@/features/courses/utils/coursePermissions"
import { NewAcademicYearButton } from "@/features/academic-years/components/NewAcademicYearButton"
import { AcademicYearsTable } from "@/features/academic-years/components/AcademicYearsTable"

export const Route = createFileRoute("/_app/gestiones")({
  beforeLoad: () => {
    // La secretaría entra sólo a duplicar la estructura de una gestión; la tabla le esconde el resto.
    if (
      !coursePermissions(useAuthStore.getState().role).canDuplicateStructure
    ) {
      throw redirect({ to: "/dashboard" })
    }
  },
  component: AcademicYearsPage,
})

function AcademicYearsPage() {
  const { canManageYears } = coursePermissions(useAuthStore((s) => s.role))
  return (
    <div className="flex min-w-0 flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold">Gestiones</h1>
          <p className="text-sm text-muted-foreground">
            {canManageYears
              ? "Crea, activa, cierra o reabre las gestiones académicas. Cerrar una gestión congela sus resultados finales y bloquea sus registros."
              : "Copia la estructura de cursos y materias de una gestión a otra que ya exista."}
          </p>
        </div>
        {canManageYears ? <NewAcademicYearButton /> : null}
      </div>
      <AcademicYearsTable />
    </div>
  )
}
