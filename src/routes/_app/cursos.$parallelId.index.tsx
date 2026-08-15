import { useMemo, useState } from "react"
import { createFileRoute, Link } from "@tanstack/react-router"
import {
  BookOpenIcon,
  InfoIcon,
  Loader2Icon,
  UserCogIcon,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useParallels } from "@/features/catalog/hooks/useCatalog"
import { useAllCourses } from "@/features/courses/hooks/useCourses"
import { CourseInfoModal } from "@/features/courses/components/CourseInfoModal"
import { SetHomeroomDialog } from "@/features/courses/components/SetHomeroomDialog"
import type { Course } from "@/features/courses/types/course"

export const Route = createFileRoute("/_app/cursos/$parallelId/")({
  component: ParallelCoursesPage,
})

function ParallelCoursesPage() {
  const { parallelId } = Route.useParams()
  const parallels = useParallels()
  const coursesQuery = useAllCourses()

  const [homeroom, setHomeroom] = useState<Course | null>(null)
  const [info, setInfo] = useState<Course | null>(null)

  const parallel = parallels.data?.find((p) => String(p.id) === parallelId)
  const parallelName = parallel?.name ?? parallelId

  const courses = useMemo(
    () =>
      (coursesQuery.data?.content ?? [])
        .filter((c) => String(c.parallelId) === parallelId)
        .sort((a, b) => a.gradeId - b.gradeId),
    [coursesQuery.data, parallelId],
  )

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-end justify-between gap-4">
        <h2 className="text-lg font-semibold">Paralelo {parallelName}</h2>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Grado</TableHead>
              <TableHead>Docente de aula</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {coursesQuery.isLoading ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-muted-foreground">
                  <Loader2Icon className="mr-2 inline size-4 animate-spin" />
                  Cargando…
                </TableCell>
              </TableRow>
            ) : courses.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-muted-foreground">
                  Sin cursos en este paralelo.
                </TableCell>
              </TableRow>
            ) : (
              courses.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.gradeName}</TableCell>
                  <TableCell>
                    {c.homeroomTeacherName ? (
                      <span>{c.homeroomTeacherName}</span>
                    ) : (
                      <Badge variant="outline" className="text-muted-foreground">
                        Sin asignar
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setInfo(c)}
                      >
                        <InfoIcon data-icon="inline-start" />
                        Info
                      </Button>
                      <Button size="sm" variant="outline" asChild>
                        <Link
                          to="/cursos/$parallelId/curso/$courseId"
                          params={{ parallelId, courseId: c.id }}
                        >
                          <BookOpenIcon data-icon="inline-start" />
                          Cuaderno
                        </Link>
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setHomeroom(c)}
                      >
                        <UserCogIcon data-icon="inline-start" />
                        Docente
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <CourseInfoModal course={info} onClose={() => setInfo(null)} />
      <SetHomeroomDialog course={homeroom} onClose={() => setHomeroom(null)} />
    </div>
  )
}
