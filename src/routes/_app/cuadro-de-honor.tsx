import { useMemo, useState } from "react"
import { createFileRoute, redirect } from "@tanstack/react-router"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuthStore } from "@/features/auth/store/authStore"
import { isRole } from "@/features/auth/types"
import { useCurrentContext } from "@/features/auth/hooks/useCurrentContext"
import { useAcademicYears } from "@/features/catalog/hooks/useCatalog"
import { useAllCourses } from "@/features/courses/hooks/useCourses"
import {
  CourseHonorRollPanel,
  InstitutionHonorRollPanel,
} from "@/features/gradebook/components/HonorRollPanel"

/**
 * Cuántos lugares tiene el podio. El corte por defecto es el que usa la escuela: tres por curso,
 * diez en toda la unidad educativa.
 */
const COURSE_PLACE_OPTIONS = [3, 5, 10] as const
const INSTITUTION_PLACE_OPTIONS = [10, 20, 30] as const

export const Route = createFileRoute("/_app/cuadro-de-honor")({
  beforeLoad: () => {
    const role = useAuthStore.getState().role
    // Secretaría no entra: el podio ordena a los estudiantes por su promedio, y eso lo lee quien
    // enseña y quien dirige, no quien administra el padrón.
    if (!isRole(role, "DIRECTOR") && !isRole(role, "TEACHER")) {
      throw redirect({ to: "/dashboard" })
    }
  },
  component: HonorRollPage,
})

function HonorRollPage() {
  const ctx = useCurrentContext()

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">Cuadro de honor</h1>
        <p className="text-sm text-muted-foreground">
          Los mejores promedios anuales, el mejor primero. Es el mismo promedio
          que imprime la libreta; el podio no lo vuelve a calcular.
        </p>
      </div>

      {ctx.isDirector ? <DirectorHonorRoll /> : <TeacherHonorRoll />}
    </div>
  )
}

/**
 * Dirección: la unidad educativa entera, y un curso a la vez.
 *
 * El podio institucional va primero porque es la pregunta que sólo Dirección puede hacer; el de
 * curso ya lo tiene el docente de aula en su propia pantalla.
 */
function DirectorHonorRoll() {
  const courses = useAllCourses()
  const years = useAcademicYears()

  const rows = useMemo(() => courses.data?.content ?? [], [courses.data])
  const [chosenCourseId, setChosenCourseId] = useState<string | null>(null)
  const [institutionPlaces, setInstitutionPlaces] = useState(10)
  const [coursePlaces, setCoursePlaces] = useState(3)

  // El primer curso mientras nadie eligió, derivado y no sincronizado en un efecto: un panel que
  // arranca vacío teniendo cursos para mostrar parece roto.
  const courseId = chosenCourseId ?? rows[0]?.id ?? null

  // La gestión actual es la primera: el catálogo las devuelve de la más reciente a la más antigua.
  // Se manda `id` y no `year` — el endpoint filtra por la clave de la fila.
  const currentYearId = years.data?.[0]?.id ?? null

  return (
    <Tabs defaultValue="institucion">
      <TabsList>
        <TabsTrigger value="institucion">Unidad educativa</TabsTrigger>
        <TabsTrigger value="curso">Por curso</TabsTrigger>
      </TabsList>

      <TabsContent value="institucion" className="flex flex-col gap-4 pt-4">
        <PlacesSelect
          value={institutionPlaces}
          onChange={setInstitutionPlaces}
          options={INSTITUTION_PLACE_OPTIONS}
        />
        <InstitutionHonorRollPanel
          academicYearId={currentYearId}
          places={institutionPlaces}
        />
      </TabsContent>

      <TabsContent value="curso" className="flex flex-col gap-4 pt-4">
        <div className="flex flex-wrap items-center gap-4">
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
          <PlacesSelect
            value={coursePlaces}
            onChange={setCoursePlaces}
            options={COURSE_PLACE_OPTIONS}
          />
        </div>

        <CourseHonorRollPanel courseId={courseId} places={coursePlaces} />
      </TabsContent>
    </Tabs>
  )
}

/**
 * Docente. Su curso de aula y nada más: el podio de otro curso no es suyo, y el de la unidad
 * educativa lo cierra la API con un 403.
 *
 * El docente técnico no tiene curso de aula. No se le muestra un selector vacío, se le dice por qué.
 */
function TeacherHonorRoll() {
  const ctx = useCurrentContext()
  const [places, setPlaces] = useState(3)

  if (!ctx.homeroomCourseId) {
    return (
      <div className="rounded-md border border-dashed p-12 text-center text-muted-foreground">
        El cuadro de honor es del curso de aula. Como docente técnico no tienes
        un curso de aula asignado.
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <PlacesSelect
        value={places}
        onChange={setPlaces}
        options={COURSE_PLACE_OPTIONS}
      />
      <CourseHonorRollPanel courseId={ctx.homeroomCourseId} places={places} />
    </div>
  )
}

function PlacesSelect({
  value,
  onChange,
  options,
}: {
  value: number
  onChange: (places: number) => void
  options: readonly number[]
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground">Lugares</span>
      <Select value={String(value)} onValueChange={(v) => onChange(Number(v))}>
        <SelectTrigger className="w-36">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option} value={String(option)}>
              {option} lugares
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
