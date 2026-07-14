import { useMemo } from "react"

import { useAuthStore } from "../store/authStore"
import { isRole } from "../types"
import { useTeacherClassGroups } from "@/features/courses/hooks/useCourses"
import type { ClassGroupItem } from "@/features/courses/types/course"

export interface CurrentContext {
  userId: string | null
  role: string | null
  isDirector: boolean
  isSecretary: boolean
  isTeacher: boolean
  /** Docente tecnico (flag technical del login). Solo dicta su materia en 18 cursos. */
  isTechnical: boolean
  /** Curso de aula fijo (homeroom) del docente aula. */
  homeroomCourseId: string | null
  /** Materias (class_groups) que dicta el docente. */
  classGroups: ClassGroupItem[]
  isLoading: boolean
}

export function useCurrentContext(): CurrentContext {
  const userId = useAuthStore((s) => s.userId)
  const role = useAuthStore((s) => s.role)

  const storeTechnical = useAuthStore((s) => s.isTechnical)
  const storeCourseId = useAuthStore((s) => s.courseId)

  const isDirector = isRole(role, "DIRECTOR")
  const isSecretary = isRole(role, "SECRETARY")
  const isTeacher = isRole(role, "TEACHER")

  const classGroupsQuery = useTeacherClassGroups(isTeacher ? userId : null)

  const classGroups = useMemo(
    () => classGroupsQuery.data ?? [],
    [classGroupsQuery.data],
  )

  // Curso de aula fijo: viene del login (claim courseId). Solo aula lo tiene.
  const homeroomCourseId = isTeacher ? (storeCourseId ?? null) : null

  const isLoading = isTeacher && classGroupsQuery.isLoading

  // Tecnico = flag technical del login (true). Director/secretario = null.
  const isTechnical = isTeacher && storeTechnical === true

  return {
    userId,
    role,
    isDirector,
    isSecretary,
    isTeacher,
    isTechnical,
    homeroomCourseId,
    classGroups,
    isLoading,
  }
}
