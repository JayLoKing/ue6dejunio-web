import { useMemo, useState } from "react"
import { Link } from "@tanstack/react-router"
import {
  BookOpenIcon,
  GraduationCapIcon,
  InfoIcon,
  Loader2Icon,
  UserCogIcon,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useAuthStore } from "@/features/auth/store/authStore"
import { AcademicYearSelect } from "@/features/catalog/components/AcademicYearSelect"
import {
  useAcademicYears,
  useParallels,
} from "@/features/catalog/hooks/useCatalog"
import { useSelectedAcademicYear } from "@/features/catalog/hooks/useSelectedAcademicYear"

import { useCoursesOfYear } from "../hooks/useCourses"
import type { Course } from "../types/course"
import { coursePermissions } from "../utils/coursePermissions"
import { CourseInfoModal } from "./CourseInfoModal"
import { SetHomeroomDialog } from "./SetHomeroomDialog"

export interface ParallelCoursesPageProps {
  parallelId: string
}

const Loading = () => (
  <div className="flex items-center justify-center gap-2 rounded-md border border-dashed p-10 text-sm text-muted-foreground">
    <Loader2Icon className="size-4 animate-spin" /> Cargando…
  </div>
)

const Failure = ({ children }: { children: string }) => (
  <div
    role="alert"
    className="rounded-md border border-dashed p-10 text-center text-sm text-destructive"
  >
    {children}
  </div>
)

/** Los cursos de un paralelo en la gestión elegida (la activa mientras nadie elija otra). */
export function ParallelCoursesPage({ parallelId }: ParallelCoursesPageProps) {
  const { canOpenNotebook, canSetHomeroom } = coursePermissions(
    useAuthStore((s) => s.role)
  )
  const parallels = useParallels()
  const yearsQuery = useAcademicYears()
  const years = yearsQuery.data ?? []
  const { academicYearId, choose } = useSelectedAcademicYear(yearsQuery.data)
  const coursesQuery = useCoursesOfYear(academicYearId)

  const [homeroom, setHomeroom] = useState<Course | null>(null)
  const [info, setInfo] = useState<Course | null>(null)

  const parallel = parallels.data?.find((p) => String(p.id) === parallelId)
  const parallelName = parallel?.name ?? parallelId

  const courses = useMemo(
    () =>
      (coursesQuery.data?.content ?? [])
        .filter((c) => String(c.parallelId) === parallelId)
        .sort((a, b) => a.gradeId - b.gradeId),
    [coursesQuery.data, parallelId]
  )

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h2 className="text-lg font-semibold">Paralelo {parallelName}</h2>
        {yearsQuery.data ? (
          <AcademicYearSelect
            years={years}
            value={academicYearId}
            onChange={choose}
          />
        ) : null}
      </div>

      {yearsQuery.isLoading ? (
        <Loading />
      ) : yearsQuery.isError ? (
        <Failure>
          No se pudieron cargar las gestiones. Intenta de nuevo.
        </Failure>
      ) : academicYearId === null ? (
        <div className="rounded-md border border-dashed p-10 text-center text-sm text-muted-foreground">
          No hay una gestión activa. Actívala en Gestiones o elige una.
        </div>
      ) : coursesQuery.isLoading ? (
        <Loading />
      ) : coursesQuery.isError ? (
        <Failure>No se pudieron cargar los cursos. Intenta de nuevo.</Failure>
      ) : courses.length === 0 ? (
        <div className="rounded-md border border-dashed p-10 text-center text-sm text-muted-foreground">
          Sin cursos en este paralelo.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {courses.map((c) => (
            <div
              key={c.id}
              className="flex flex-col gap-4 rounded-lg border bg-card p-4 transition-colors hover:border-brand/40"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex flex-col">
                  <span className="text-lg font-semibold">{c.gradeName}</span>
                  <span className="text-xs text-muted-foreground">
                    Paralelo {parallelName}
                  </span>
                </div>
                <span className="flex size-10 items-center justify-center rounded-lg bg-brand/10 text-brand">
                  <GraduationCapIcon className="size-5" />
                </span>
              </div>

              <div className="flex items-center gap-2 text-sm">
                <UserCogIcon className="size-4 text-muted-foreground" />
                {c.homeroomTeacherName ? (
                  <span className="truncate">{c.homeroomTeacherName}</span>
                ) : (
                  <Badge variant="outline" className="text-muted-foreground">
                    Sin docente de aula
                  </Badge>
                )}
              </div>

              <div className="flex flex-wrap gap-2 border-t pt-3">
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1"
                  onClick={() => setInfo(c)}
                >
                  <InfoIcon data-icon="inline-start" />
                  Info
                </Button>
                {canOpenNotebook ? (
                  <Button
                    size="sm"
                    className="flex-1 bg-brand text-brand-foreground hover:bg-brand/90"
                    asChild
                  >
                    <Link
                      to="/cursos/$parallelId/curso/$courseId"
                      params={{ parallelId, courseId: c.id }}
                    >
                      <BookOpenIcon data-icon="inline-start" />
                      Cuaderno
                    </Link>
                  </Button>
                ) : null}
                {canSetHomeroom ? (
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    onClick={() => setHomeroom(c)}
                  >
                    <UserCogIcon data-icon="inline-start" />
                    Docente
                  </Button>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}

      <CourseInfoModal course={info} onClose={() => setInfo(null)} />
      <SetHomeroomDialog course={homeroom} onClose={() => setHomeroom(null)} />
    </div>
  )
}
