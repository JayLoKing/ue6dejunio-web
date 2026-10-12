import * as pdfjsLib from "pdfjs-dist"
import type { TextItem as PdfTextItem } from "pdfjs-dist/types/src/display/api"
import PdfWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url"

import { studentRowsFromItems, type TextItem } from "../utils/pdfParser"
import { rosterHeaderFromItems } from "../utils/rosterHeader"
import type { ParsedRoster, ParsedStudentRow, RosterHeader } from "../types"

pdfjsLib.GlobalWorkerOptions.workerSrc = PdfWorker

/**
 * Lee la nómina en PDF y devuelve el curso que dice su cabecera y los estudiantes que trae.
 *
 * Vive acá y no en utils porque abre el archivo: `arrayBuffer`, el documento y cada página son
 * entrada/salida, y además fija el worker de pdfjs al importarse. Lo único que hace es convertir
 * el texto a coordenadas; reconocer la cabecera y las filas es de `utils`.
 */
export const parseStudentsPdf = async (file: File): Promise<ParsedRoster> => {
  const buffer = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data: buffer }).promise

  const collected: ParsedStudentRow[] = []
  let header: RosterHeader | null = null

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum)
    const content = await page.getTextContent()

    const items: TextItem[] = content.items
      .filter((it): it is PdfTextItem => "str" in it && "transform" in it)
      .map((it) => ({
        str: it.str,
        x: it.transform[4],
        y: it.transform[5],
        width: it.width,
      }))
      .filter((it) => it.str.trim().length > 0)

    // La cabecera que identifica el curso se lee de la primera página.
    if (pageNum === 1) header = rosterHeaderFromItems(items)

    // La numeración sigue de una página a la otra: el docente lee una lista, no varias.
    collected.push(...studentRowsFromItems(items, collected.length))
  }

  return { header, rows: collected }
}
