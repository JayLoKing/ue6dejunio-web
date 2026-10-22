import { useMemo, useState } from "react"
import { createFileRoute, redirect } from "@tanstack/react-router"
import { InfoIcon } from "lucide-react"

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
import { NoHomeroomCourseNotice } from "@/components/shared/NoHomeroomCourseNotice"
import { useCurrentContext } from "@/features/auth/hooks/useCurrentContext"
import { activeAcademicYear } from "@/features/catalog/utils/activeAcademicYear"
import { useAcademicYears } from "@/features/catalog/hooks/useCatalog"
import { useActiveYearCourses } from "@/features/courses/hooks/useActiveYearCourses"
import type { ClassGroupItem } from "@/features/courses/types/course"
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
    // Secretaría entra: RF 35 le da este reporte, y no hay nada que escribir acá — el podio se lee y
    // se exporta. El diagrama de casos de uso ya se lo daba y el documento de RF todavía no; el
    // documento es el que queda por corregir.
    if (
      !isRole(role, "DIRECTOR") &&
      !isRole(role, "TEACHER") &&
      !isRole(role, "SECRETARY")
    ) {
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

      {/* Secretaría lee lo mismo que Dirección: acá no hay ninguna acción que escribir, así que la
          vista de toda la escuela sirve igual para las dos. */}
      {ctx.isDirector || ctx.isSecretary ? (
        <SchoolWideHonorRoll />
      ) : (
        <TeacherHonorRoll />
      )}
    </div>
  )
}

/**
 * Dirección y Secretaría: la unidad educativa entera, y un curso a la vez.
 *
 * El podio institucional va primero porque es la pregunta que sólo se puede hacer desde arriba; el
 * de curso ya lo tiene el docente de aula en su propia pantalla.
 */
function SchoolWideHonorRoll() {
  const courses = useActiveYearCourses()
  const years = useAcademicYears()

  const rows = useMemo(() => courses.data?.content ?? [], [courses.data])
  const [chosenCourseId, setChosenCourseId] = useState<string | null>(null)
  const [institutionPlaces, setInstitutionPlaces] = useState(10)
  const [coursePlaces, setCoursePlaces] = useState(3)

  // El primer curso mientras nadie eligió, derivado y no sincronizado en un efecto: un panel que
  // arranca vacío teniendo cursos para mostrar parece roto.
  const courseId = chosenCourseId ?? rows[0]?.id ?? null

  // La gestión actual es la activa (`activeAcademicYear`), no la más reciente.
  // Se manda `id` y no `year` — el endpoint filtra por la clave de la fila. El `year` va aparte,
  // sólo para que el documento diga la gestión en el número que la persona lee.
  const activeYear = activeAcademicYear(years.data)
  const currentYearId = activeYear?.id ?? null
  const currentYear = activeYear?.year ?? null

  const chosen = rows.find((course) => course.id === courseId)
  const courseLabel = chosen
    ? `${chosen.gradeName} ${chosen.parallelName}`
    : undefined

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
          year={currentYear}
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
                <SelectValue
                  placeholder={
                    courses.isError
                      ? "No se pudieron cargar los cursos"
                      : "Selecciona un curso"
                  }
                />
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

        <CourseHonorRollPanel
          courseId={courseId}
          places={coursePlaces}
          courseLabel={courseLabel}
        />
      </TabsContent>
    </Tabs>
  )
}

/**
 * Docente. Su curso de aula y nada más: el podio de otro curso no es suyo, y el de la unidad
 * educativa lo cierra la API con un 403.
 *
 * El docente técnico no tiene curso de aula, pero dicta su materia en varios: elige uno de esos.
 * Sin curso de aula ni materias no hay podio que leer, y se le dice por qué en vez de mostrarle un
 * selector vacío.
 */
function TeacherHonorRoll() {
  const ctx = useCurrentContext()
  // Del store y no del contexto: el token ya trae el grado y el paralelo del curso de aula, y el
  // contexto no los reexpone. Sirven sólo para nombrar el curso en el documento.
  const gradeName = useAuthStore((s) => s.gradeName)
  const parallelName = useAuthStore((s) => s.parallelName)
  const [places, setPlaces] = useState(3)

  if (ctx.isTechnical) {
    if (ctx.classGroups.length > 0) {
      return <TechnicalHonorRoll classGroups={ctx.classGroups} />
    }
    return (
      <div className="rounded-md border border-dashed p-12 text-center text-muted-foreground">
        El cuadro de honor es del curso de aula. Como docente técnico no tienes
        un curso de aula asignado.
      </div>
    )
  }

  if (!ctx.homeroomCourseId) {
    return (
      <NoHomeroomCourseNotice whatYouWillSee="el cuadro de honor del curso" />
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <PlacesSelect
        value={places}
        onChange={setPlaces}
        options={COURSE_PLACE_OPTIONS}
      />
      {/* El nombre del curso viene de la sesión: el docente de aula tiene uno solo, y el token ya
          trae su grado y paralelo — no hace falta pedir la lista de cursos para nombrarlo. */}
      <CourseHonorRollPanel
        courseId={ctx.homeroomCourseId}
        places={places}
        courseLabel={
          gradeName && parallelName ? `${gradeName} ${parallelName}` : undefined
        }
      />
    </div>
  )
}

/**
 * Docente técnico: el podio de cualquiera de los cursos donde dicta su materia.
 *
 * Los cursos salen de sus materias y no de la lista de cursos: son exactamente los que la API le
 * deja leer, y un curso con dos de sus materias aparece una sola vez.
 *
 * El ranking es el del curso entero, con todas las materias — no el de la suya. Por eso el aviso:
 * sin él, el docente leería el podio como el de su propia materia.
 */
function TechnicalHonorRoll({
  classGroups,
}: {
  classGroups: ClassGroupItem[]
}) {
  const courses = useMemo(() => {
    const seen = new Map<string, string>()
    for (const group of classGroups) {
      if (!seen.has(group.courseId)) {
        seen.set(group.courseId, `${group.gradeName} ${group.parallelName}`)
      }
    }
    return [...seen].map(([id, label]) => ({ id, label }))
  }, [classGroups])
  const [chosenCourseId, setChosenCourseId] = useState<string | null>(null)
  const [places, setPlaces] = useState(3)

  // El primer curso mientras nadie eligió, derivado y no sincronizado en un efecto.
  const courseId = chosenCourseId ?? courses[0]?.id ?? null
  const chosen = courses.find((course) => course.id === courseId)

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <span
            id="technical-honor-course"
            className="text-sm text-muted-foreground"
          >
            Curso
          </span>
          <Select value={courseId ?? ""} onValueChange={setChosenCourseId}>
            <SelectTrigger
              className="w-56"
              aria-labelledby="technical-honor-course"
            >
              <SelectValue placeholder="Selecciona un curso" />
            </SelectTrigger>
            <SelectContent>
              {courses.map((course) => (
                <SelectItem key={course.id} value={course.id}>
                  {course.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <PlacesSelect
          value={places}
          onChange={setPlaces}
          options={COURSE_PLACE_OPTIONS}
        />
      </div>

      <p className="flex items-start gap-2 text-sm text-muted-foreground">
        <InfoIcon className="mt-0.5 size-4 shrink-0" />
        Este cuadro de honor considera el promedio de todas las materias del
        curso, no solo la tuya.
      </p>

      <CourseHonorRollPanel
        courseId={courseId}
        places={places}
        courseLabel={chosen?.label}
      />
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
