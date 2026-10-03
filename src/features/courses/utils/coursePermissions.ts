import { isRole } from "@/features/auth/types"

/**
 * Lo que el rol puede hacer sobre los cursos.
 *
 * Dirección y secretaría comparten el ciclo de vida del curso: alta con sus materias, el docente de
 * aula de UN curso, darlo de baja o reactivarlo, crear una gestión y duplicar su estructura. Lo demás sigue detrás de la Dirección
 * en la API (intercambiar docentes de aula, el docente de una materia, el cuaderno del curso y la
 * administración de gestiones), así que la pantalla no lo ofrece a otro rol: un botón que termina
 * en 403 es peor que no tenerlo. Vive aparte para probar la decisión sin montar las pantallas.
 */
export interface CoursePermissions {
  canCreateCourse: boolean
  canSetHomeroom: boolean
  canDuplicateStructure: boolean
  canSwapHomeroom: boolean
  canReassignSubjectTeacher: boolean
  canOpenNotebook: boolean
  /** Activar, cerrar y reabrir una gestión: lo único de ellas que sigue siendo de Dirección. */
  canManageYears: boolean
  /** Crear una gestión (POST /academic-years, abierto a la secretaría). */
  canCreateYear: boolean
  /** Dar de baja y reactivar un curso (PUT y DELETE /courses/{id}). */
  canDeactivateCourse: boolean
}

export function coursePermissions(role: string | null): CoursePermissions {
  const isDirector = isRole(role, "DIRECTOR")
  const runsLifecycle = isDirector || isRole(role, "SECRETARY")
  return {
    canCreateCourse: runsLifecycle,
    canSetHomeroom: runsLifecycle,
    canDuplicateStructure: runsLifecycle,
    canSwapHomeroom: isDirector,
    canReassignSubjectTeacher: isDirector,
    canOpenNotebook: isDirector,
    canManageYears: isDirector,
    canCreateYear: runsLifecycle,
    canDeactivateCourse: runsLifecycle,
  }
}
