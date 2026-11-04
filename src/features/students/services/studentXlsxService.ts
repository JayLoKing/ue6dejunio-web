import JSZip from "jszip"

import type { NominaBlock } from "../types"
import {
  nominaBlocksFromSheet,
  sharedStringsFromXml,
} from "../utils/nominaXlsx"

const SHEET_RE = /^xl\/worksheets\/sheet(\d+)\.xml$/

const UNREADABLE =
  "No se pudo leer la planilla. Verifica que sea un archivo Excel (.xlsx)."

/**
 * Lee la nómina de la escuela en .xlsx y devuelve los cursos que trae, cada uno con sus filas.
 *
 * Vive acá y no en utils porque abre el archivo: un .xlsx es un zip de XML, y descomprimirlo es
 * entrada/salida. Reconocer los cursos y los nombres entre las celdas es de `utils`.
 *
 * Se leen todas las hojas en orden: la planilla real usa sólo la primera, pero una hoja vacía no
 * aporta bloques, y así no hace falta adivinar cuál es la buena.
 */
export const parseNominaXlsx = async (file: File): Promise<NominaBlock[]> => {
  let zip: JSZip
  try {
    zip = await JSZip.loadAsync(await file.arrayBuffer())
  } catch {
    throw new Error(UNREADABLE)
  }

  const sharedXml = await zip.file("xl/sharedStrings.xml")?.async("string")
  const shared = sharedXml ? sharedStringsFromXml(sharedXml) : []

  const sheets = Object.keys(zip.files)
    .map((path) => ({ path, n: Number(path.match(SHEET_RE)?.[1]) }))
    .filter((s) => !Number.isNaN(s.n))
    .sort((a, b) => a.n - b.n)
  if (sheets.length === 0) throw new Error(UNREADABLE)

  const blocks: NominaBlock[] = []
  for (const { path } of sheets) {
    const xml = await zip.file(path)!.async("string")
    blocks.push(...nominaBlocksFromSheet(xml, shared))
  }
  return blocks
}
