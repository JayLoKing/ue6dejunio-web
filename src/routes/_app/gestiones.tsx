import { createFileRoute, redirect } from "@tanstack/react-router"

import { useAuthStore } from "@/features/auth/store/authStore"
import { coursePermissions } from "@/features/courses/utils/coursePermissions"
import { AcademicYearsPage } from "@/features/academic-years/components/AcademicYearsPage"

export const Route = createFileRoute("/_app/gestiones")({
  beforeLoad: () => {
    // La secretaría entra a crear una gestión y a duplicar su estructura; la tabla le esconde el resto.
    if (
      !coursePermissions(useAuthStore.getState().role).canDuplicateStructure
    ) {
      throw redirect({ to: "/dashboard" })
    }
  },
  component: AcademicYearsPage,
})
