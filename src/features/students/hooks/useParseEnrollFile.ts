import { useMutation } from "@tanstack/react-query"

import { parseStudentsPdf } from "../services/studentPdfService"
import { parseNominaXlsx } from "../services/studentXlsxService"
import type { ParsedEnrollFile } from "../types"

export const XLSX_MIME =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"

/** Lo que acepta el selector de archivo: la nómina del SIE en PDF o la planilla de la escuela. */
export const ENROLL_FILE_ACCEPT = `application/pdf,.pdf,${XLSX_MIME},.xlsx`

const UNSUPPORTED =
  "Formato no soportado. Sube la nómina en PDF o Excel (.xlsx)."

/**
 * Qué formato es el archivo. Por la extensión primero: Windows entrega un .xlsx sin tipo cuando no
 * tiene Excel instalado, y el tipo vacío no debe rechazar la planilla correcta.
 */
const formatOf = (file: File): "pdf" | "xlsx" | null => {
  const name = file.name.toLowerCase()
  if (name.endsWith(".xlsx") || file.type === XLSX_MIME) return "xlsx"
  if (name.endsWith(".pdf") || file.type === "application/pdf") return "pdf"
  return null
}

export const parseEnrollFile = async (
  file: File
): Promise<ParsedEnrollFile> => {
  const format = formatOf(file)
  if (format === "xlsx") {
    return { kind: "xlsx", blocks: await parseNominaXlsx(file) }
  }
  if (format === "pdf") {
    const roster = await parseStudentsPdf(file)
    return "blocks" in roster
      ? { kind: "pdf-school", roster }
      : { kind: "pdf", roster }
  }
  throw new Error(UNSUPPORTED)
}

/**
 * Lee la nómina que el docente eligió, PDF o .xlsx.
 *
 * Una mutación y no una llamada suelta en el componente: leer el archivo es entrada/salida, y así
 * el pendiente y el error los lleva react-query en lugar de tres useState puestos a mano.
 */
export function useParseEnrollFile() {
  return useMutation<ParsedEnrollFile, Error, File>({
    mutationFn: (file) => parseEnrollFile(file),
  })
}
