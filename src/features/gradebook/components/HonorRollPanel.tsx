import { useMemo } from "react"
import { Loader2Icon } from "lucide-react"

import { useHonorRoll, useInstitutionHonorRoll } from "../hooks/useGradebook"
import { HonorRollTable } from "./HonorRollTable"

export interface CourseHonorRollPanelProps {
  courseId: string | null
  places: number
}

/**
 * El podio de un curso.
 *
 * Sin la columna de aula: todas sus filas vienen del mismo curso, y repetirla treinta veces no
 * agrega nada que el encabezado de la pantalla no diga ya.
 */
export function CourseHonorRollPanel({
  courseId,
  places,
}: CourseHonorRollPanelProps) {
  const podium = useHonorRoll(courseId, places)
  const rows = useMemo(() => podium.data ?? [], [podium.data])

  if (!courseId) {
    return (
      <p className="text-sm text-muted-foreground">
        Selecciona un curso para ver su cuadro de honor.
      </p>
    )
  }

  if (podium.isLoading) {
    return <Loading />
  }

  if (podium.isError) {
    return <LoadFailed />
  }

  return <HonorRollTable rows={rows} />
}

export interface InstitutionHonorRollPanelProps {
  /** La clave de la fila de la gestión. `id_academic_year` es un SERIAL, no el año calendario. */
  academicYearId: number | null
  places: number
}

/**
 * El podio de toda la unidad educativa en una gestión.
 *
 * Con la columna de aula, que es lo único que distingue a dos estudiantes del mismo nombre en un
 * edificio entero. La gestión es obligatoria del lado de la API: un podio que abarcara varios años
 * enfrentaría a un estudiante de 2024 con uno de 2026.
 */
export function InstitutionHonorRollPanel({
  academicYearId,
  places,
}: InstitutionHonorRollPanelProps) {
  const podium = useInstitutionHonorRoll(academicYearId, places)
  const rows = useMemo(() => podium.data ?? [], [podium.data])

  if (academicYearId === null) {
    return (
      <p className="text-sm text-muted-foreground">
        Sin gestión activa: el cuadro de honor de la unidad educativa es de un
        año a la vez.
      </p>
    )
  }

  if (podium.isLoading) {
    return <Loading />
  }

  if (podium.isError) {
    return <LoadFailed />
  }

  return <HonorRollTable rows={rows} showCourse />
}

function Loading() {
  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <Loader2Icon className="size-4 animate-spin" />
      Cargando el cuadro de honor…
    </div>
  )
}

/**
 * Una consulta que falló no puede caer en la tabla vacía: "sin estudiantes calificados" es una
 * respuesta sobre la gestión, y es la contraria a "no se pudo preguntar".
 */
function LoadFailed() {
  return (
    <p className="text-sm text-destructive">
      No se pudo cargar el cuadro de honor. Reintenta en un momento.
    </p>
  )
}
