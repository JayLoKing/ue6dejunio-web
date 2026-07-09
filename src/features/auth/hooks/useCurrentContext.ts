import { useMemo } from "react"

import { useAuthStore } from "../store/authStore"
import { isRole } from "../types"
import {
  useAllCourses,
  useTeacherClassGroups,
} from "@/features/courses/hooks/useCourses"
import type { ClassGroupItem } from "@/features/courses/types/course"

export interface CurrentContext {
  userId: string | null
  role: string | null
  isDirector: boolean
  isSecretary: boolean
  isTeacher: boolean
  /** Docente tecnico = docente sin curso de aula (solo dicta materias). */
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

  const isDirector = isRole(role, "DIRECTOR")
  const isSecretary = isRole(role, "SECRETARY")
  const isTeacher = isRole(role, "TEACHER")

  const classGroupsQuery = useTeacherClassGroups(isTeacher ? userId : null)
  const coursesQuery = useAllCourses(isTeacher)

  const classGroups = useMemo(
    () => classGroupsQuery.data ?? [],
    [classGroupsQuery.data],
  )

  const homeroomCourseId = useMemo(() => {
    if (!isTeacher || !userId) return null
    const mine = (coursesQuery.data?.content ?? []).find(
      (c) => c.homeroomTeacherId === userId,
    )
    return mine?.id ?? null
  }, [isTeacher, userId, coursesQuery.data])

  const isLoading =
    isTeacher && (classGroupsQuery.isLoading || coursesQuery.isLoading)

  // Tecnico: docente que dicta materias pero no es homeroom de ningun curso.
  const isTechnical = isTeacher && !homeroomCourseId

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
