import { useMutation } from "@tanstack/react-query"

import { parseStudentsPdf } from "../services/studentPdfService"
import type { ParsedStudentRow } from "../types"

/**
 * Lee la nómina PDF que el docente eligió.
 *
 * Una mutación y no una llamada suelta en el componente: leer el archivo es entrada/salida, y así
 * el pendiente y el error los lleva react-query en lugar de tres useState puestos a mano.
 */
export function useParseStudentsPdf() {
  return useMutation<ParsedStudentRow[], Error, File>({
    mutationFn: (file) => parseStudentsPdf(file),
  })
}
