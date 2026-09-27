import { useState } from "react"
import { FileDownIcon, Loader2Icon } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { saveBlob } from "@/lib/saveBlob"
// `Institution` se toma de su feature a propósito, y no se copia acá como una forma estructural: es
// el membrete real de la unidad educativa, el mismo tipo que ya leen `reportCardDocx` y
// `pedagogicalReportDocx`. Duplicarlo daría dos definiciones del encabezado que los documentos
// imprimen, y un campo nuevo entraría en una sola.
import type { Institution } from "@/features/institution/types"

import type { ReportColumn, TabularReportInput } from "@/lib/tabularReportDocx"

/**
 * El botón que baja un reporte tabular en DOCX.
 *
 * Uno para los cuatro reportes: la librería `docx` pesa y se carga recién cuando alguien pide el
 * archivo —no tiene nada que hacer en el bundle de quien sólo vino a mirar un listado— y esa carga
 * diferida, el estado de "escribiendo" y el nombre del archivo eran lo mismo copiado cuatro veces.
 *
 * Deshabilitado sin membrete: el documento lleva el encabezado de la unidad educativa, y emitirlo
 * antes de tenerlo produciría una hoja con los campos en blanco que alguien archivaría igual.
 */
export interface ExportReportButtonProps {
  school: Institution | undefined
  title: string
  subtitles: string[]
  columns: ReportColumn[]
  rows: string[][]
  emptyLabel?: string
  /** Sin extensión: la pone este componente, que es el que sabe que escribe DOCX. */
  filename: string
  label?: string
}

export function ExportReportButton({
  school,
  title,
  subtitles,
  columns,
  rows,
  emptyLabel,
  filename,
  label = "Exportar DOCX",
}: ExportReportButtonProps) {
  const [writing, setWriting] = useState(false)

  const download = async () => {
    if (!school) return
    setWriting(true)
    try {
      const [{ tabularReportDocxOf }, { Packer }] = await Promise.all([
        import("@/lib/tabularReportDocx"),
        import("docx"),
      ])
      const input: TabularReportInput = {
        school,
        title,
        subtitles,
        columns,
        rows,
        emptyLabel,
      }
      saveBlob(
        await Packer.toBlob(tabularReportDocxOf(input)),
        `${filename}.docx`
      )
    } catch {
      // Escribir el documento puede fallar —la carga diferida de `docx` depende de la red, y armarlo
      // corre en el navegador— y sin este aviso el único síntoma sería que el spinner se apaga y no
      // aparece ningún archivo. La persona se queda esperando una descarga que nunca fue.
      toast.error("No se pudo generar el documento. Reintenta en un momento.")
    } finally {
      // En `finally`: pase lo que pase, el botón vuelve a estar disponible en vez de quedar
      // diciendo "Generando…" para siempre.
      setWriting(false)
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      className="gap-2"
      disabled={writing || !school}
      title={school ? undefined : "Faltan los datos de la unidad educativa"}
      onClick={() => void download()}
    >
      {writing ? (
        <Loader2Icon className="size-4 animate-spin" />
      ) : (
        <FileDownIcon className="size-4" />
      )}
      {writing ? "Generando…" : label}
    </Button>
  )
}
