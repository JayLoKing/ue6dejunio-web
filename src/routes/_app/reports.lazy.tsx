import { useMemo, useState } from "react"
import { createLazyFileRoute } from "@tanstack/react-router"
import { Loader2Icon } from "lucide-react"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useCurrentContext } from "@/features/auth/hooks/useCurrentContext"
import { useAuthStore } from "@/features/auth/store/authStore"
import { useAllCourses } from "@/features/courses/hooks/useCourses"
import { CentralizerTable } from "@/features/gradebook/components/CentralizerTable"
import { AverageRanking } from "@/features/gradebook/components/AverageRanking"
import { AnnualSheetsPanel } from "@/features/gradebook/components/AnnualSheetsPanel"
import { AttendanceReportPanel } from "@/features/gradebook/components/AttendanceReportPanel"
import { ReportCardPanel } from "@/features/gradebook/components/ReportCardPanel"
import { PedagogicalReportPanel } from "@/features/gradebook/components/PedagogicalReportPanel"

export const Route = createLazyFileRoute("/_app/reports")({
  component: ReportsPage,
})

/** El alcance anual del reporte de asistencia: el trimestre ausente es lo que el backend lee así. */
const ANNUAL = "anual"

/**
 * Los reportes del curso.
 *
 * Dirección y Secretaría eligen el curso; el docente de aula tiene el suyo y no elige. Es la misma
 * página para los tres porque los documentos son los mismos: separar la de Secretaría habría sido
 * mantener dos copias del consolidado y de la libreta.
 *
 * El informe pedagógico es la excepción y no aparece para Secretaría: lo redacta el docente y lo
 * consulta Dirección (RF 38). No es un documento que se derive de los datos, es uno que alguien
 * escribe.
 */
function ReportsPage() {
  const ctx = useCurrentContext()

  if (ctx.isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2Icon className="size-4 animate-spin" /> Cargando…
      </div>
    )
  }

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">Reportes</h1>
        <p className="text-sm text-muted-foreground">
          Consolidado de calificaciones, libretas, asistencia e informe
          pedagógico del curso.
        </p>
      </div>

      {ctx.isDirector || ctx.isSecretary ? (
        <SchoolWideReports canReadPedagogicalReport={ctx.isDirector} />
      ) : (
        <TeacherReports />
      )}
    </div>
  )
}

/** Dirección y Secretaría: cualquier curso, eligiéndolo. */
function SchoolWideReports({
  canReadPedagogicalReport,
}: {
  canReadPedagogicalReport: boolean
}) {
  const courses = useAllCourses()
  const rows = useMemo(() => courses.data?.content ?? [], [courses.data])
  const [chosenCourseId, setChosenCourseId] = useState<string | null>(null)

  // El primer curso mientras nadie eligió, derivado y no guardado en un efecto: una pantalla que
  // arranca vacía teniendo cursos para mostrar parece rota.
  const courseId = chosenCourseId ?? rows[0]?.id ?? null
  const chosen = rows.find((course) => course.id === courseId)

  if (courses.isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2Icon className="size-4 animate-spin" /> Cargando los cursos…
      </div>
    )
  }

  if (rows.length === 0) {
    return (
      <div className="rounded-md border border-dashed p-12 text-center text-muted-foreground">
        No hay cursos creados todavía. Los reportes se emiten sobre un curso.
      </div>
    )
  }

  return (
    <div className="flex min-w-0 flex-col gap-4">
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Curso</span>
        <Select value={courseId ?? ""} onValueChange={setChosenCourseId}>
          <SelectTrigger className="w-64">
            <SelectValue placeholder="Selecciona un curso" />
          </SelectTrigger>
          <SelectContent>
            {rows.map((course) => (
              <SelectItem key={course.id} value={course.id}>
                {course.gradeName} {course.parallelName} · {course.year}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {courseId ? (
        <ReportTabs
          courseId={courseId}
          courseLabel={
            chosen ? `${chosen.gradeName} ${chosen.parallelName}` : undefined
          }
          year={chosen?.year ?? null}
          canReadPedagogicalReport={canReadPedagogicalReport}
        />
      ) : null}
    </div>
  )
}

/**
 * Docente. Su curso de aula y nada más.
 *
 * El docente técnico no tiene curso de aula: se le dice por qué en vez de mostrarle un selector que
 * no puede usar.
 */
function TeacherReports() {
  const ctx = useCurrentContext()
  // Del store: el token ya trae el grado y el paralelo del curso de aula, así que nombrarlo no cuesta
  // una consulta.
  const gradeName = useAuthStore((s) => s.gradeName)
  const parallelName = useAuthStore((s) => s.parallelName)

  if (!ctx.homeroomCourseId) {
    return (
      <div className="rounded-md border border-dashed p-12 text-center text-muted-foreground">
        El consolidado es del curso de aula. Como docente técnico no tienes un
        curso de aula asignado.
      </div>
    )
  }

  return (
    <ReportTabs
      courseId={ctx.homeroomCourseId}
      courseLabel={
        gradeName && parallelName ? `${gradeName} ${parallelName}` : undefined
      }
      year={null}
      canReadPedagogicalReport
    />
  )
}

function ReportTabs({
  courseId,
  courseLabel,
  year,
  canReadPedagogicalReport,
}: {
  courseId: string
  courseLabel?: string
  year: number | null
  canReadPedagogicalReport: boolean
}) {
  // El alcance de la asistencia se elige aparte del trimestre académico: el reporte de regularidad
  // suele pedirse del año entero, que es lo que una certificación cubre.
  const [attendanceScope, setAttendanceScope] = useState<string>(ANNUAL)
  const attendanceTrimester =
    attendanceScope === ANNUAL ? null : Number(attendanceScope)

  return (
    <Tabs defaultValue="centralizador">
      <TabsList>
        <TabsTrigger value="centralizador">Centralizador</TabsTrigger>
        <TabsTrigger value="anual">Consolidado anual</TabsTrigger>
        <TabsTrigger value="libretas">Libretas</TabsTrigger>
        <TabsTrigger value="asistencia">Asistencia</TabsTrigger>
        <TabsTrigger value="promedios">Promedios</TabsTrigger>
        {canReadPedagogicalReport ? (
          <TabsTrigger value="informe">Informe pedagógico</TabsTrigger>
        ) : null}
      </TabsList>
      <TabsContent value="centralizador" className="pt-4">
        <CentralizerTable courseId={courseId} />
      </TabsContent>
      <TabsContent value="anual" className="pt-4">
        <AnnualSheetsPanel
          courseId={courseId}
          courseLabel={courseLabel}
          year={year}
        />
      </TabsContent>
      <TabsContent value="libretas" className="pt-4">
        <ReportCardPanel courseId={courseId} />
      </TabsContent>
      <TabsContent value="asistencia" className="flex flex-col gap-4 pt-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Alcance</span>
          <Select value={attendanceScope} onValueChange={setAttendanceScope}>
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ANNUAL}>Todo el año</SelectItem>
              <SelectItem value="1">Primer trimestre</SelectItem>
              <SelectItem value="2">Segundo trimestre</SelectItem>
              <SelectItem value="3">Tercer trimestre</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <AttendanceReportPanel
          courseId={courseId}
          trimester={attendanceTrimester}
          courseLabel={courseLabel}
        />
      </TabsContent>
      <TabsContent value="promedios" className="pt-4">
        <AverageRanking courseId={courseId} />
      </TabsContent>
      {canReadPedagogicalReport ? (
        <TabsContent value="informe" className="pt-4">
          <PedagogicalReportPanel courseId={courseId} />
        </TabsContent>
      ) : null}
    </Tabs>
  )
}
