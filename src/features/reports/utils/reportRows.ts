import {
  formatProbability,
  riskLevelLabel,
} from "@/features/risk/utils/riskLevel"
import type { InstitutionRiskEntry } from "@/features/risk/types/risk"

import { formatMark } from "@/features/gradebook/utils/annualMarks"
import { statusOf } from "@/lib/grading"
import type {
  HonorRollEntry,
  StudentAnnualSummary,
  StudentAttendanceRow,
} from "@/features/gradebook/types"

import type { ReportColumn } from "@/lib/tabularReportDocx"

/**
 * Los datos de cada reporte convertidos en filas de texto para el documento.
 *
 * Separado del builder DOCX a propósito: acá vive lo que cada RF pide que diga cada columna, que es
 * una decisión del reporte, y allá cómo se dibuja una tabla, que es la misma para todos. Separados,
 * lo que el RF exige se puede probar sin abrir un zip.
 *
 * VIVE EN SU PROPIA FEATURE, y por eso: estas funciones leen datos de gradebook, de risk y de
 * asistencia, así que ponerlas en cualquiera de las tres la haría depender de las otras dos. `lib`
 * tampoco era el lugar — ahí las features dependen de `lib` y no al revés, y dejar el cimiento
 * atado a tres árboles de tipos invierte esa dirección. "Reportes" es el módulo que los RF nombran,
 * y leer de varias features es justamente lo que hace.
 *
 * Lo genérico se queda afuera: `tabularReportDocx` dibuja una tabla y `ExportReportButton` baja un
 * archivo, sin saber de qué reporte. Eso es de `lib` y de `components/shared`. Acá vive sólo lo que
 * cada RF exige que diga cada columna.
 *
 * Ningún formato se inventa acá. El porcentaje de riesgo y la categoría salen de
 * `@/features/risk/utils/riskLevel`, que es de donde los sacan las tablas en pantalla: el documento
 * y la pantalla tienen que decir el mismo número con las mismas palabras.
 */

/** Lo que se escribe donde no hay dato. Nunca un cero: un cero es una afirmación. */
const NO_DATA = "—"

/** "Primero A", como la escuela nombra un curso cuando habla de uno. */
const courseLabel = (row: {
  gradeName: string
  parallelName: string
}): string => `${row.gradeName} ${row.parallelName}`

export interface HonorRollRowOptions {
  /**
   * Si la fila lleva la columna de curso. El podio institucional sí —es lo único que distingue a dos
   * estudiantes del mismo nombre en un edificio entero—; el de un curso no, porque todas sus filas
   * vienen del mismo y el encabezado del documento ya lo dice.
   */
  withCourse: boolean
}

/** RF 35: posición, nombre, grado y paralelo, y promedio final. */
export function honorRollRows(
  entries: HonorRollEntry[],
  { withCourse }: HonorRollRowOptions
): string[][] {
  return entries.map((entry) => {
    const average = entry.finalAverage.toFixed(1)
    return withCourse
      ? [String(entry.position), entry.fullName, courseLabel(entry), average]
      : [String(entry.position), entry.fullName, average]
  })
}

/** RF 36: nombre, grado y paralelo, materia de mayor riesgo, categoría y probabilidad. */
export function riskReportRows(entries: InstitutionRiskEntry[]): string[][] {
  return entries.map((entry) => [
    entry.fullName,
    courseLabel(entry),
    entry.subjectName,
    riskLevelLabel(entry.riskLevel),
    formatProbability(entry.pFail),
  ])
}

/**
 * RF 37: el porcentaje por estudiante y los totales de presentes, ausentes, con licencia y con
 * atraso.
 *
 * El orden de las columnas sigue al del RF, que nombra la licencia antes del atraso — no el del
 * objeto, que agrupa `late` con los que descuentan.
 */
export function attendanceReportRows(rows: StudentAttendanceRow[]): string[][] {
  return rows.map((row, index) => [
    String(index + 1),
    row.studentName,
    String(row.present),
    String(row.absent),
    String(row.excused),
    String(row.late),
    row.percentage === null ? NO_DATA : `${row.percentage.toFixed(1)}%`,
  ])
}

/**
 * Las columnas del consolidado (RF 34), que no son fijas: una por área curricular del curso.
 *
 * Los nombres de área salen de la primera fila, no de un catálogo: el centralizador ya trae las áreas
 * que ESE curso dicta, y pedirlas aparte podría traer una que el curso no tiene o perder una que sí.
 * Un curso sin estudiantes no tiene de dónde sacarlas, y devuelve sólo las fijas.
 */
export function centralizerColumns(
  rows: StudentAnnualSummary[]
): ReportColumn[] {
  const areas = rows[0]?.subjects.map((subject) => subject.subjectName) ?? []
  return [
    { header: "N°", width: 500, align: "center" },
    { header: "Estudiante", width: 2600 },
    ...areas.map((name) => ({
      header: name,
      width: 900,
      align: "center" as const,
    })),
    { header: "1er trim.", width: 800, align: "center" as const },
    { header: "2do trim.", width: 800, align: "center" as const },
    { header: "3er trim.", width: 800, align: "center" as const },
    { header: "Promedio final", width: 1000, align: "center" as const },
    { header: "Estado", width: 1100, align: "center" as const },
  ]
}

/**
 * RF 34: cada estudiante con sus calificaciones por área, el promedio de cada trimestre, el promedio
 * final y la indicación de aprobación o reprobación.
 *
 * La indicación es la palabra y no un color: el RF la llama "indicación visual", y en una hoja que se
 * imprime y se fotocopia en blanco y negro un color no indica nada. "Sin calificar" no es reprobado —
 * `statusOf` decide sobre un número, y sin promedio no hay número sobre el que decidir.
 *
 * Las áreas se leen de la primera fila, igual que `centralizerColumns`, para que las celdas caigan
 * bajo su encabezado. Si una fila trae las áreas en otro orden, se busca por nombre.
 */
export function centralizerRows(rows: StudentAnnualSummary[]): string[][] {
  const areas = rows[0]?.subjects.map((subject) => subject.subjectName) ?? []
  return rows.map((row, index) => [
    String(index + 1),
    row.fullName,
    ...areas.map((name) =>
      formatMark(
        row.subjects.find((subject) => subject.subjectName === name)?.average,
        1
      )
    ),
    formatMark(row.trimesterAverages[0], 1),
    formatMark(row.trimesterAverages[1], 1),
    formatMark(row.trimesterAverages[2], 1),
    formatMark(row.finalAverage, 1),
    row.finalAverage == null ? "Sin calificar" : statusOf(row.finalAverage),
  ])
}
