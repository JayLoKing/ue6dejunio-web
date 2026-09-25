import { useState } from "react"
import { createFileRoute, Link } from "@tanstack/react-router"
import { ArrowLeftIcon, UserIcon } from "lucide-react"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TrimesterSelect } from "@/components/shared/TrimesterSelect"
import { useAllCourses } from "@/features/courses/hooks/useCourses"
import { CentralizerTable } from "@/features/gradebook/components/CentralizerTable"
import { CourseAttendancePanel } from "@/features/gradebook/components/CourseAttendancePanel"
import { CourseRiskPanel } from "@/features/risk/components/CourseRiskPanel"
import { CourseStudentsPanel } from "@/features/students/components/CourseStudentsPanel"

export const Route = createFileRoute(
  "/_app/cursos/$parallelId/curso/$courseId/"
)({
  component: CourseGradebookPage,
})

function CourseGradebookPage() {
  const { parallelId, courseId } = Route.useParams()
  const coursesQuery = useAllCourses()
  const course = coursesQuery.data?.content.find((c) => c.id === courseId)
  const [trimester, setTrimester] = useState(1)

  return (
    <div className="flex min-w-0 flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <Link
          to="/cursos/$parallelId"
          params={{ parallelId }}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeftIcon className="size-4" /> Volver
        </Link>
        <h2 className="text-lg font-semibold">
          Cuaderno pedagógico
          {course ? (
            <span className="ml-2 text-sm font-normal text-muted-foreground">
              {course.gradeName} {course.parallelName}
            </span>
          ) : null}
        </h2>
        {course?.homeroomTeacherName ? (
          <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
            <UserIcon className="size-4" /> {course.homeroomTeacherName}
          </span>
        ) : null}
      </div>

      <Tabs defaultValue="notas">
        <TabsList>
          <TabsTrigger value="notas">Notas</TabsTrigger>
          <TabsTrigger value="asistencia">Asistencia</TabsTrigger>
          <TabsTrigger value="estudiantes">Estudiantes</TabsTrigger>
          <TabsTrigger value="riesgo">Riesgo</TabsTrigger>
        </TabsList>

        <TabsContent value="notas" className="pt-4">
          <p className="pb-3 text-xs text-muted-foreground">
            Consolidado de solo lectura. Selecciona un estudiante para ver su
            detalle por dimensión.
          </p>
          <CentralizerTable
            courseId={courseId}
            renderStudent={(row) => (
              <Link
                to="/cursos/$parallelId/curso/$courseId/estudiante/$enrollmentId"
                params={{
                  parallelId,
                  courseId,
                  enrollmentId: row.courseEnrollmentId,
                }}
                className="text-brand underline-offset-4 hover:underline"
              >
                {row.fullName}
              </Link>
            )}
          />
        </TabsContent>

        <TabsContent value="asistencia" className="pt-4">
          <CourseAttendancePanel courseId={courseId} />
        </TabsContent>

        {/* La baja va acá y no en el consolidado de notas: esa tabla es de solo lectura, y colgarle
            una acción la vuelve otra cosa. Acá el curso se lee como padrón. */}
        <TabsContent value="estudiantes" className="pt-4">
          <p className="pb-3 text-xs text-muted-foreground">
            Padrón del curso. Quien fue dado de baja se sigue mostrando, con su
            motivo.
          </p>
          <CourseStudentsPanel courseId={courseId} />
        </TabsContent>

        {/* Sólo lectura, como el resto de esta pantalla: atender una predicción es de quien da la
            materia, y Dirección no da ninguna. El panel entero vive en /riesgo. */}
        <TabsContent value="riesgo" className="pt-4">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3">
            <p className="text-xs text-muted-foreground">
              Lo que el modelo anticipa en las materias de este curso. Predice
              sobre lo ya calificado: a quien le falta una dimensión, no lo
              evalúa.
            </p>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Trimestre</span>
              <TrimesterSelect
                value={trimester}
                onChange={setTrimester}
                showRange={false}
              />
            </div>
          </div>
          <CourseRiskPanel courseId={courseId} trimester={trimester} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
