import * as pdfjsLib from "pdfjs-dist"
import type { TextItem as PdfTextItem } from "pdfjs-dist/types/src/display/api"
import PdfWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url"

import { studentRowsFromItems, type TextItem } from "../utils/pdfParser"
import type { ParsedStudentRow } from "../types"

pdfjsLib.GlobalWorkerOptions.workerSrc = PdfWorker

/**
 * Lee la nómina en PDF y devuelve los estudiantes que trae.
 *
 * Vive acá y no en utils porque abre el archivo: `arrayBuffer`, el documento y cada página son
 * entrada/salida, y además fija el worker de pdfjs al importarse. Lo único que hace es convertir
 * el texto a coordenadas; reconocer las filas es de `utils/pdfParser`.
 */
export const parseStudentsPdf = async (
  file: File
): Promise<ParsedStudentRow[]> => {
  const buffer = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data: buffer }).promise

  const collected: ParsedStudentRow[] = []

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

    // La numeración sigue de una página a la otra: el docente lee una lista, no varias.
    collected.push(...studentRowsFromItems(items, collected.length))
  }

  return collected
}
