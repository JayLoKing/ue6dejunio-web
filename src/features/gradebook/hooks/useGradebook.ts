import {
  keepPreviousData,
  skipToken,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query"
import { toast } from "sonner"

import type { PageQuery } from "@/lib/types/pagination"

import { GradebookService } from "../services/gradebookService"
import type { SavePedagogicalReportPayload } from "../types"

export function useCentralizer(
  courseId: string | null | undefined,
  trimester: number,
  query: PageQuery
) {
  return useQuery({
    queryKey: ["gradebook", "centralizer", courseId ?? "", trimester, query],
    queryFn: courseId
      ? () => GradebookService.centralizer(courseId, trimester, query)
      : skipToken,
    placeholderData: keepPreviousData,
  })
}

/** El año completo del curso: las tres hojas de cierre salen de esta única consulta. */
export function useAnnualCentralizer(
  courseId: string | null | undefined,
  query: PageQuery
) {
  return useQuery({
    queryKey: ["gradebook", "annual-centralizer", courseId ?? "", query],
    queryFn: courseId
      ? () => GradebookService.annualCentralizer(courseId, query)
      : skipToken,
    placeholderData: keepPreviousData,
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
