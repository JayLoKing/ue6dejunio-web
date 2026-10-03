import { createFileRoute, redirect } from "@tanstack/react-router"

import { useAuthStore } from "@/features/auth/store/authStore"
import { AssignCourseSubjectsForm } from "@/features/courses/components/AssignCourseSubjectsForm"
import { coursePermissions } from "@/features/courses/utils/coursePermissions"

export const Route = createFileRoute("/_app/courses")({
  beforeLoad: () => {
    if (!coursePermissions(useAuthStore.getState().role).canCreateCourse) {
      throw redirect({ to: "/dashboard" })
    }
  },
  component: CoursesPage,
})

function CoursesPage() {
  return (
    <div className="flex min-w-0 flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">Asignar materias a curso</h1>
        <p className="text-sm text-muted-foreground">
          Configura grado, paralelo, docente de aula y materias.
        </p>
      </div>
      <AssignCourseSubjectsForm />
    </div>
  )
}
