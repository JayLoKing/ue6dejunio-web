import { createFileRoute, redirect } from "@tanstack/react-router"

import { useAuthStore } from "@/features/auth/store/authStore"
import { isRole } from "@/features/auth/types"
import { AcademicYearsTable } from "@/features/academic-years/components/AcademicYearsTable"

export const Route = createFileRoute("/_app/gestiones")({
  beforeLoad: () => {
    if (!isRole(useAuthStore.getState().role, "DIRECTOR")) {
      throw redirect({ to: "/dashboard" })
    }
  },
  component: AcademicYearsPage,
})

function AcademicYearsPage() {
  return (
    <div className="flex min-w-0 flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">Gestiones</h1>
        <p className="text-sm text-muted-foreground">
          Activa, cierra o reabre las gestiones académicas. Cerrar una gestión
          congela sus resultados finales y bloquea sus registros.
        </p>
      </div>
      <AcademicYearsTable />
    </div>
  )
}
