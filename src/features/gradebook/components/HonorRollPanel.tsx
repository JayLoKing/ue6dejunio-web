import { useMemo } from "react"
import { Loader2Icon } from "lucide-react"

import { useInstitution } from "@/features/institution/hooks/useInstitution"

import { useHonorRoll, useInstitutionHonorRoll } from "../hooks/useGradebook"
import { honorRollRows } from "@/features/reports/utils/reportRows"
import { ExportReportButton } from "@/components/shared/ExportReportButton"
import { HonorRollTable } from "./HonorRollTable"

/** RF 35: posición, nombre del estudiante, su grado y paralelo, y su promedio final. */
const COLUMNS_WITH_COURSE = [
  { header: "N°", width: 700, align: "center" as const },
  { header: "Estudiante", width: 4200 },
  { header: "Curso", width: 1800, align: "center" as const },
  { header: "Promedio final", width: 1600, align: "center" as const },
]

/** El de un curso no repite el aula en cada fila: el encabezado del documento ya lo dice. */
const COLUMNS_WITHOUT_COURSE = [
  { header: "N°", width: 700, align: "center" as const },
  { header: "Estudiante", width: 5200 },
  { header: "Promedio final", width: 1800, align: "center" as const },
]

export interface CourseHonorRollPanelProps {
  courseId: string | null
  places: number
  /** Cómo nombrar el curso en el documento, p. ej. "Primero A". Sin esto no se ofrece exportar. */
  courseLabel?: string
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
  courseLabel,
}: CourseHonorRollPanelProps) {
  const podium = useHonorRoll(courseId, places)
  const { data: school } = useInstitution()
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

  return (
    <div className="flex flex-col gap-3">
      {courseLabel ? (
        <div className="flex justify-end">
          <ExportReportButton
            school={school}
            title="CUADRO DE HONOR"
            subtitles={[
              `Curso: ${courseLabel}`,
              `Los ${places} mejores promedios finales`,
            ]}
            columns={COLUMNS_WITHOUT_COURSE}
            rows={honorRollRows(rows, { withCourse: false })}
            emptyLabel="Sin estudiantes con promedio final en este curso."
            filename={`cuadro-de-honor-${courseLabel.replace(/\s+/g, "-").toLowerCase()}`}
          />
        </div>
      ) : null}
      <HonorRollTable rows={rows} />
    </div>
  )
}

export interface InstitutionHonorRollPanelProps {
  /** La clave de la fila de la gestión. `id_academic_year` es un SERIAL, no el año calendario. */
  academicYearId: number | null
  places: number
  /** El año calendario, para el documento. Es el que la persona lee, no la clave SERIAL. */
  year?: number | null
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
  year,
}: InstitutionHonorRollPanelProps) {
  const podium = useInstitutionHonorRoll(academicYearId, places)
  const { data: school } = useInstitution()
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

  return (
    <div className="flex flex-col gap-3">
      <div className="flex justify-end">
        <ExportReportButton
          school={school}
          title="CUADRO DE HONOR"
          subtitles={[
            "Alcance: unidad educativa",
            `Gestión ${year ?? ""}`.trim(),
            `Los ${places} mejores promedios finales`,
          ]}
          columns={COLUMNS_WITH_COURSE}
          rows={honorRollRows(rows, { withCourse: true })}
          emptyLabel="Sin estudiantes con promedio final en esta gestión."
          filename={`cuadro-de-honor-unidad-educativa-${year ?? "gestion"}`}
        />
      </div>
      <HonorRollTable rows={rows} showCourse />
    </div>
  )
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
