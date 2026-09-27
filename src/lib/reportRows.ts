import {
  formatProbability,
  riskLevelLabel,
} from "@/features/risk/utils/riskLevel"
import type { InstitutionRiskEntry } from "@/features/risk/types/risk"

import type {
  HonorRollEntry,
  StudentAttendanceRow,
} from "@/features/gradebook/types"

/**
 * Los datos de cada reporte convertidos en filas de texto para el documento.
 *
 * Separado del builder DOCX a propósito: acá vive lo que cada RF pide que diga cada columna, que es
 * una decisión del reporte, y allá cómo se dibuja una tabla, que es la misma para todos. Separados,
 * lo que el RF exige se puede probar sin abrir un zip.
 *
 * VIVE EN `lib` Y NO EN UNA FEATURE, y por eso: las tres funciones leen datos de tres features
 * distintas —gradebook, risk y asistencia—, así que ponerlo en cualquiera de ellas la haría depender
 * de las otras dos. `lib` es donde ya viven `tabularReportDocx` y `saveBlob`, que son sus vecinos de
 * tarea.
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
