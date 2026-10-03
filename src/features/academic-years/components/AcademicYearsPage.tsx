import { useAuthStore } from "@/features/auth/store/authStore"
import { coursePermissions } from "@/features/courses/utils/coursePermissions"

import { AcademicYearsTable } from "./AcademicYearsTable"
import { NewAcademicYearButton } from "./NewAcademicYearButton"

/** Gestiones: la secretaría crea una y copia su estructura; activar, cerrar y reabrir es de Dirección. */
export function AcademicYearsPage() {
  const { canManageYears, canCreateYear } = coursePermissions(
    useAuthStore((s) => s.role)
  )
  return (
    <div className="flex min-w-0 flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold">Gestiones</h1>
          <p className="text-sm text-muted-foreground">
            {canManageYears
              ? "Crea, activa, cierra o reabre las gestiones académicas. Cerrar una gestión congela sus resultados finales y bloquea sus registros."
              : "Crea una gestión o copia la estructura de cursos y materias de una gestión a otra que ya exista."}
          </p>
        </div>
        {canCreateYear ? <NewAcademicYearButton /> : null}
      </div>
      <AcademicYearsTable />
    </div>
  )
}
