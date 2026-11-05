import * as pdfjsLib from "pdfjs-dist"
import type { TextItem as PdfTextItem } from "pdfjs-dist/types/src/display/api"
import PdfWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url"

import { studentRowsFromItems, type TextItem } from "../utils/pdfParser"
import { rosterHeaderFromItems } from "../utils/rosterHeader"
import {
  isSchoolRosterPage,
  schoolRosterFromPages,
} from "../utils/sieSchoolRoster"
import type {
  ParsedRoster,
  ParsedStudentRow,
  RosterHeader,
  SchoolRoster,
} from "../types"

pdfjsLib.GlobalWorkerOptions.workerSrc = PdfWorker

/** El texto de cada página como fragmentos con su posición. */
const readPages = async (file: File): Promise<TextItem[][]> => {
  const buffer = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data: buffer }).promise

  const pages: TextItem[][] = []
  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum)
    const content = await page.getTextContent()

    pages.push(
      content.items
        .filter((it): it is PdfTextItem => "str" in it && "transform" in it)
        .map((it) => ({
          str: it.str,
          x: it.transform[4],
          y: it.transform[5],
          width: it.width,
        }))
        .filter((it) => it.str.trim().length > 0)
    )
  }
  return pages
}

/**
 * Lee la nómina en PDF del SIE. La de un curso devuelve el curso que dice su cabecera y sus
 * estudiantes; la de toda la unidad, sus cursos con los estudiantes de cada uno.
 *
 * Vive acá y no en utils porque abre el archivo: `arrayBuffer`, el documento y cada página son
 * entrada/salida, y además fija el worker de pdfjs al importarse. Lo único que hace es convertir
 * el texto a coordenadas; reconocer la cabecera, los cursos y las filas es de `utils`.
 */
export const parseStudentsPdf = async (
  file: File
): Promise<ParsedRoster | SchoolRoster> => {
  const pages = await readPages(file)

  // La de toda la unidad no trae "Grado:" sino un "Año de Escolaridad" por curso.
  const header: RosterHeader | null = pages[0]
    ? rosterHeaderFromItems(pages[0])
    : null
  if (!header && pages[0] && isSchoolRosterPage(pages[0])) {
    return schoolRosterFromPages(pages)
  }

  // La numeración sigue de una página a la otra: el docente lee una lista, no varias.
  const collected: ParsedStudentRow[] = []
  for (const items of pages) {
    collected.push(...studentRowsFromItems(items, collected.length))
  }
  return { header, rows: collected }
}
