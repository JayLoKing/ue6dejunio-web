import { useMemo, useState } from "react"
import { createFileRoute, redirect } from "@tanstack/react-router"
import { BrainCircuitIcon, Loader2Icon } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TrimesterSelect } from "@/components/shared/TrimesterSelect"
import { useAuthStore } from "@/features/auth/store/authStore"
import { isRole } from "@/features/auth/types"
import { useCurrentContext } from "@/features/auth/hooks/useCurrentContext"
import { useAcademicYears } from "@/features/catalog/hooks/useCatalog"
import { useAllCourses } from "@/features/courses/hooks/useCourses"
import { ClassGroupRiskPanel } from "@/features/risk/components/ClassGroupRiskPanel"
import { CourseRiskPanel } from "@/features/risk/components/CourseRiskPanel"
import { InstitutionRiskPanel } from "@/features/risk/components/InstitutionRiskPanel"
import { usePredictYearRisk } from "@/features/risk/hooks/useRisk"

/** Cuántos estudiantes trae la lista de la unidad educativa. */
const PLACE_OPTIONS = [10, 20, 30, 50] as const
const DEFAULT_PLACES = 10

export const Route = createFileRoute("/_app/riesgo")({
  beforeLoad: () => {
    const role = useAuthStore.getState().role
    // Secretaría no entra: una predicción nombra a un estudiante y su probabilidad de reprobar,
    // y eso es de quien enseña y de quien dirige, no de quien administra el padrón.
    if (!isRole(role, "DIRECTOR") && !isRole(role, "TEACHER")) {
      throw redirect({ to: "/dashboard" })
    }
  },
  component: RiskPage,
})

function RiskPage() {
  const ctx = useCurrentContext()
  const [trimester, setTrimester] = useState(1)

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold">Riesgo académico</h1>
          <p className="text-sm text-muted-foreground">
            Lo que el modelo anticipa por estudiante y materia. Predice sobre lo
            ya calificado: a quien le falta una dimensión, no lo evalúa.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Trimestre</span>
          <TrimesterSelect value={trimester} onChange={setTrimester} />
        </div>
      </div>

      {ctx.isDirector ? (
        <DirectorRisk trimester={trimester} />
      ) : (
        <TeacherRisk trimester={trimester} />
      )}
    </div>
  )
}

/**
 * Dirección: un curso a la vez, y el barrido de toda la gestión.
 *
 * El barrido corre el modelo sobre cada materia activa del año, así que no está junto al curso
 * elegido: no es "predecir esto", es "predecir todo", y confundirlos haría que un clic distraído
 * recalcule la escuela entera.
 */
function DirectorRisk({ trimester }: { trimester: number }) {
  const courses = useAllCourses()
  const years = useAcademicYears()
  const predictYear = usePredictYearRisk()

  const rows = useMemo(() => courses.data?.content ?? [], [courses.data])
  const [chosenCourseId, setChosenCourseId] = useState<string | null>(null)
  const [places, setPlaces] = useState(DEFAULT_PLACES)

  // El primer curso mientras nadie eligió, derivado y no sincronizado en un efecto: un panel que
  // arranca vacío teniendo cursos para mostrar parece roto, y el Director tendría que elegir para
  // descubrir que había algo. Guardar la elección en un efecto haría el mismo trabajo con un
  // render de más y un estado que puede quedar apuntando a un curso que la lista ya no trae.
  const courseId = chosenCourseId ?? rows[0]?.id ?? null

  // La gestión actual es la primera: el catálogo las devuelve de la más reciente a la más antigua.
  // Dos claves distintas de la misma fila y no intercambiables: el barrido manda `year`, el año
  // calendario; la lista institucional manda `id`, la clave SERIAL de la fila.
  const currentYear = years.data?.[0]?.year ?? null
  const currentYearId = years.data?.[0]?.id ?? null

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-end gap-3">
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          disabled={predictYear.isPending || currentYear === null}
          title={
            currentYear === null
              ? "Sin gestión activa"
              : `Corre el modelo sobre todas las materias de ${currentYear}`
          }
          onClick={() =>
            currentYear !== null &&
            predictYear.mutate({ academicYear: currentYear, trimester })
          }
        >
          {predictYear.isPending ? (
            <Loader2Icon className="size-4 animate-spin" />
          ) : (
            <BrainCircuitIcon className="size-4 text-primary" />
          )}
          Ejecutar modelo en toda la gestión
        </Button>
      </div>

      <Tabs defaultValue="institucion">
        <TabsList>
          <TabsTrigger value="institucion">Unidad educativa</TabsTrigger>
          <TabsTrigger value="curso">Por curso</TabsTrigger>
        </TabsList>

        <TabsContent value="institucion" className="flex flex-col gap-4 pt-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-muted-foreground">Cuántos</span>
            <Select
              value={String(places)}
              onValueChange={(value) => setPlaces(Number(value))}
            >
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PLACE_OPTIONS.map((option) => (
                  <SelectItem key={option} value={String(option)}>
                    {option} estudiantes
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              Un estudiante por fila, con la materia que más lo compromete.
            </p>
          </div>

          <InstitutionRiskPanel
            academicYearId={currentYearId}
            trimester={trimester}
            places={places}
          />
        </TabsContent>

        <TabsContent value="curso" className="flex flex-col gap-4 pt-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Curso</span>
            <Select
              value={courseId ?? ""}
              onValueChange={setChosenCourseId}
              disabled={courses.isLoading || rows.length === 0}
            >
              <SelectTrigger className="w-56">
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

          {/* Dirección lee; atender una predicción es de quien da la materia. */}
          <CourseRiskPanel courseId={courseId} trimester={trimester} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

/**
 * Docente. Dos formas distintas del mismo panel, porque son dos formas distintas de dar clases.
 *
 * El de aula tiene un curso y nueve materias: lee el curso entero de una. El técnico da una
 * materia en muchos cursos, así que elige cuál, y el listado no repite el nombre de la materia.
 */
function TeacherRisk({ trimester }: { trimester: number }) {
  const ctx = useCurrentContext()
  const [chosenClassGroupId, setChosenClassGroupId] = useState<string | null>(
    null
  )

  const classGroups = ctx.classGroups

  // Las materias que dicta, que es exactamente lo que puede atender: la API guarda esa escritura
  // por la materia de la predicción, y el docente de aula lee las nueve de su curso sin dar
  // necesariamente las técnicas.
  const ownedClassGroupIds = useMemo(
    () => classGroups.map((cg) => cg.id),
    [classGroups]
  )

  // Derivado, no sincronizado: ver el comentario equivalente en el panel de Dirección.
  const classGroupId = chosenClassGroupId ?? classGroups[0]?.id ?? null

  if (ctx.isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2Icon className="size-4 animate-spin" />
        Cargando tus materias…
      </div>
    )
  }

  if (!ctx.isTechnical) {
    return (
      <CourseRiskPanel
        courseId={ctx.homeroomCourseId}
        trimester={trimester}
        ownedClassGroupIds={ownedClassGroupIds}
      />
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Curso</span>
        <Select
          value={classGroupId ?? ""}
          onValueChange={setChosenClassGroupId}
          disabled={classGroups.length === 0}
        >
          <SelectTrigger className="w-56">
            <SelectValue placeholder="Selecciona un curso" />
          </SelectTrigger>
          <SelectContent>
            {classGroups.map((cg) => (
              <SelectItem key={cg.id} value={cg.id}>
                {cg.gradeName} {cg.parallelName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <ClassGroupRiskPanel classGroupId={classGroupId} trimester={trimester} />
    </div>
  )
}
