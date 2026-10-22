import {
  keepPreviousData,
  skipToken,
  useMutation,
  useQueries,
  useQuery,
  useQueryClient,
  type UseQueryResult,
} from "@tanstack/react-query"
import { toast } from "sonner"

import type { PageQuery } from "@/lib/types/pagination"

import { GradebookService } from "../services/gradebookService"
import type { SavePedagogicalReportPayload } from "../types"

/**
 * Varias consultas leídas como una: los datos en el orden pedido, pendiente mientras alguna lo
 * esté y fallida si alguna falló. Una lista con un hueco no es una que un gráfico dibuje con verdad.
 */
export interface CombinedQueries<T> {
  data: (T | undefined)[]
  isPending: boolean
  isError: boolean
}

/**
 * Fuera del componente a propósito: `useQueries` vuelve a correr `combine` cada vez que cambia su
 * identidad, y una flecha en línea entregaría un arreglo nuevo en cada render.
 */
function combineQueries<T>(results: UseQueryResult<T>[]): CombinedQueries<T> {
  return {
    data: results.map((r) => r.data),
    isPending: results.some((r) => r.isPending),
    isError: results.some((r) => r.isError),
  }
}

const centralizerKey = (
  courseId: string,
  trimester: number,
  query: PageQuery
) => ["gradebook", "centralizer", courseId, trimester, query]

const annualCentralizerKey = (courseId: string, query: PageQuery) => [
  "gradebook",
  "annual-centralizer",
  courseId,
  query,
]

const classGroupAttendanceByStudentKey = (
  classGroupId: string,
  trimester: number | null,
  query: PageQuery
) => [
  "gradebook",
  "class-group-attendance-by-student",
  classGroupId,
  trimester ?? "annual",
  query,
]

export function useCentralizer(
  courseId: string | null | undefined,
  trimester: number,
  query: PageQuery
) {
  return useQuery({
    queryKey: centralizerKey(courseId ?? "", trimester, query),
    queryFn: courseId
      ? () => GradebookService.centralizer(courseId, trimester, query)
      : skipToken,
    placeholderData: keepPreviousData,
  })
}

/**
 * El centralizador de varios cursos en un trimestre, una consulta por curso. Es el tablero del
 * docente técnico: la API recorta cada fila a sus materias, así que un curso es una petición.
 */
export function useCentralizers(
  courseIds: string[],
  trimester: number,
  query: PageQuery
) {
  return useQueries({
    queries: courseIds.map((courseId) => ({
      queryKey: centralizerKey(courseId, trimester, query),
      queryFn: () => GradebookService.centralizer(courseId, trimester, query),
      placeholderData: keepPreviousData,
    })),
    combine: combineQueries,
  })
}

/** El año completo del curso: las tres hojas de cierre salen de esta única consulta. */
export function useAnnualCentralizer(
  courseId: string | null | undefined,
  query: PageQuery
) {
  return useQuery({
    queryKey: annualCentralizerKey(courseId ?? "", query),
    queryFn: courseId
      ? () => GradebookService.annualCentralizer(courseId, query)
      : skipToken,
    placeholderData: keepPreviousData,
  })
}

/** El año completo de varios cursos, una consulta por curso: los tres trimestres en una respuesta. */
export function useAnnualCentralizers(courseIds: string[], query: PageQuery) {
  return useQueries({
    queries: courseIds.map((courseId) => ({
      queryKey: annualCentralizerKey(courseId, query),
      queryFn: () => GradebookService.annualCentralizer(courseId, query),
    })),
    combine: combineQueries,
  })
}

/** El podio de un curso: los mejores promedios finales, el mejor primero. */
export function useHonorRoll(
  courseId: string | null | undefined,
  places: number
) {
  return useQuery({
    queryKey: ["gradebook", "honor-roll", courseId ?? "", places],
    queryFn: courseId
      ? () => GradebookService.honorRoll(courseId, places)
      : skipToken,
  })
}

/**
 * El podio de toda la unidad educativa. Sólo Dirección.
 *
 * @param academicYearId la clave de la fila de la gestión, no el año calendario.
 */
export function useInstitutionHonorRoll(
  academicYearId: number | null | undefined,
  places: number
) {
  return useQuery({
    queryKey: [
      "gradebook",
      "honor-roll",
      "institution",
      academicYearId ?? "",
      places,
    ],
    queryFn: academicYearId
      ? () => GradebookService.institutionHonorRoll(academicYearId, places)
      : skipToken,
  })
}

/** La libreta de un estudiante. El encabezado de la escuela se lee aparte, de `useInstitution`. */
export function useReportCard(courseEnrollmentId: string | null | undefined) {
  return useQuery({
    queryKey: ["gradebook", "report-card", courseEnrollmentId ?? ""],
    queryFn: courseEnrollmentId
      ? () => GradebookService.reportCard(courseEnrollmentId)
      : skipToken,
  })
}

export function useCourseAttendance(
  courseId: string | null | undefined,
  query: PageQuery,
  date?: string
) {
  return useQuery({
    queryKey: ["gradebook", "attendance", courseId ?? "", query, date ?? null],
    queryFn: courseId
      ? () => GradebookService.attendance(courseId, query, date)
      : skipToken,
    placeholderData: keepPreviousData,
  })
}

/**
 * RF 37 de una sola materia: el porcentaje de asistencia de cada estudiante con las marcas de sesión
 * de ese class group. Es el reporte del docente técnico, que no lee la asistencia diaria del curso.
 *
 * `trimester` en null es el alcance anual y viaja en la clave, igual que en el reporte del curso.
 */
export function useClassGroupAttendanceByStudent(
  classGroupId: string | null | undefined,
  trimester: number | null,
  query: PageQuery
) {
  return useQuery({
    queryKey: classGroupAttendanceByStudentKey(
      classGroupId ?? "",
      trimester,
      query
    ),
    placeholderData: keepPreviousData,
    queryFn: classGroupId
      ? () =>
          GradebookService.classGroupAttendanceByStudent(
            classGroupId,
            trimester,
            query
          )
      : skipToken,
  })
}

/** La asistencia de sesión de varios class groups, una consulta cada uno, con las claves del hook singular. */
export function useClassGroupsAttendanceByStudent(
  classGroupIds: string[],
  trimester: number | null,
  query: PageQuery
) {
  return useQueries({
    queries: classGroupIds.map((classGroupId) => ({
      queryKey: classGroupAttendanceByStudentKey(
        classGroupId,
        trimester,
        query
      ),
      queryFn: () =>
        GradebookService.classGroupAttendanceByStudent(
          classGroupId,
          trimester,
          query
        ),
      placeholderData: keepPreviousData,
    })),
    combine: combineQueries,
  })
}

export function useStudentSummary(
  courseEnrollmentId: string | null | undefined,
  trimester: number
) {
  return useQuery({
    queryKey: [
      "gradebook",
      "student-summary",
      courseEnrollmentId ?? "",
      trimester,
    ],
    queryFn: courseEnrollmentId
      ? () => GradebookService.studentSummary(courseEnrollmentId, trimester)
      : skipToken,
  })
}

/** Estadísticas de asistencia del curso (KPIs %). trimester opcional. */
export function useCourseAttendanceStats(
  courseId: string | null | undefined,
  trimester?: number
) {
  return useQuery({
    queryKey: [
      "gradebook",
      "attendance-stats",
      courseId ?? "",
      trimester ?? "all",
    ],
    queryFn: courseId
      ? () => GradebookService.attendanceStats(courseId, trimester)
      : skipToken,
  })
}

const pedagogicalReportKey = (courseId: string, trimester: number) => [
  "gradebook",
  "pedagogical-report",
  courseId,
  trimester,
]

/**
 * El informe pedagógico del curso en un trimestre.
 *
 * Llega entero aunque nadie lo haya escrito: las secciones I, III y IV se derivan de la nómina y
 * de las notas, y sólo la prosa nace vacía.
 */
export function usePedagogicalReport(
  courseId: string | null | undefined,
  trimester: number
) {
  return useQuery({
    queryKey: pedagogicalReportKey(courseId ?? "", trimester),
    queryFn: courseId
      ? () => GradebookService.pedagogicalReport(courseId, trimester)
      : skipToken,
  })
}

/**
 * Guarda el informe. Sólo el docente de aula pasa el permiso de escritura.
 *
 * El servidor responde con la hoja ya armada, así que se escribe directo en la caché en vez de
 * invalidar: un refetch podría aterrizar encima de lo que el docente sigue tipeando.
 */
export function useSavePedagogicalReport() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (v: {
      courseId: string
      trimester: number
      payload: SavePedagogicalReportPayload
    }) =>
      GradebookService.savePedagogicalReport(
        v.courseId,
        v.trimester,
        v.payload
      ),
    onSuccess: (sheet, v) => {
      toast.success("Informe guardado.")
      qc.setQueryData(pedagogicalReportKey(v.courseId, v.trimester), sheet)
    },
    onError: () => {
      toast.error("No se pudo guardar el informe.")
    },
  })
}

/** Consolidado por dimensión (todas las materias) de un course_enrollment. */
export function useEnrollmentScores(
  courseEnrollmentId: string | null | undefined
) {
  return useQuery({
    queryKey: ["scores", "enrollment", courseEnrollmentId ?? ""],
    queryFn: courseEnrollmentId
      ? () => GradebookService.enrollmentScores(courseEnrollmentId)
      : skipToken,
  })
}

/**
 * La tabla académica de Dirección: una fila por curso de la gestión.
 *
 * Una sola consulta para toda la escuela. Antes esto se armaba llamando al centralizador curso por
 * curso desde el navegador, que son treinta peticiones para dibujar una tabla.
 */
export function useCourseSummary(
  academicYearId: number | null | undefined,
  trimester: number
) {
  return useQuery({
    queryKey: ["gradebook", "course-summary", academicYearId ?? "", trimester],
    queryFn: academicYearId
      ? () => GradebookService.courseSummary(academicYearId, trimester)
      : skipToken,
  })
}
