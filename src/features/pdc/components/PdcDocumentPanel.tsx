import { useState } from "react"
import {
  FileDownIcon,
  Loader2Icon,
  PrinterIcon,
  ZoomInIcon,
  ZoomOutIcon,
} from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import type { Institution } from "@/features/institution/types"
import type { Adaptation } from "@/features/adaptation/types"

import { PDC_DOCUMENT_ID, PdcPreview } from "./PdcPreview"
import type { Pdc } from "../types"
import { planLabel } from "../utils/planLabel"
import { printableDocumentOf } from "../utils/printDocument"
import { DEFAULT_ZOOM, ZOOM_STEPS, zoomIn, zoomOut } from "../utils/zoom"

/**
 * Hands a file to the browser.
 *
 * <p>The anchor goes into the document and the object URL is released on the next tick. Clicking a
 * detached anchor and revoking its URL in the same statement raced the download in some browsers,
 * which read the blob after the click returns.
 */
function saveBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  link.style.display = "none"
  document.body.appendChild(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 0)
}

/**
 * The document as a real Office file.
 *
 * <p>Written from the plan rather than from the markup on screen, so what Word opens does not
 * depend on a stylesheet that never travelled with it. The library is loaded only when somebody
 * asks for the file — it is a document writer, and it has no business in the bundle everyone
 * downloads to see a listing.
 */
async function downloadPdcAsDocx(
  plan: Pdc,
  institution: Institution | undefined,
  adaptations: Adaptation[]
) {
  const [{ pdcDocxOf }, { Packer }] = await Promise.all([
    import("../utils/pdcDocx"),
    import("docx"),
  ])
  const title = planLabel(plan)
  const blob = await Packer.toBlob(
    pdcDocxOf({ plan, institution, adaptations })
  )
  saveBlob(blob, `${title}.docx`)
}

/**
 * Prints the document on a page of its own.
 *
 * <p>Not `window.print()`: on screen the sheet sits inside a dialog, which is a fixed, transformed,
 * scrolling box. A print stylesheet cannot lift a child out of one — the sheet came out cropped,
 * and the browser dropped the form's fills on the way. Handed to a frame that holds nothing but the
 * document, there is nothing left to escape from.
 */
function printPdcDocument(title: string) {
  const node = document.getElementById(PDC_DOCUMENT_ID)
  if (!node) return

  const frame = document.createElement("iframe")
  frame.setAttribute("aria-hidden", "true")
  frame.setAttribute("title", title)
  frame.style.position = "fixed"
  frame.style.right = "0"
  frame.style.bottom = "0"
  frame.style.width = "0"
  frame.style.height = "0"
  frame.style.border = "0"

  frame.onload = () => {
    const view = frame.contentWindow
    if (!view) {
      frame.remove()
      return
    }
    // Taking the frame away while the dialog is still open cancels the job in some browsers, so it
    // leaves on afterprint — and on a timer too, because Safari does not always fire it.
    const done = () => frame.remove()
    view.addEventListener("afterprint", done, { once: true })
    setTimeout(done, 60_000)
    view.focus()
    view.print()
  }

  document.body.appendChild(frame)
  frame.srcdoc = printableDocumentOf(node.innerHTML, title)
}

export interface PdcDocumentPanelProps {
  plan: Pdc
  /** The school's heading. Absent while it is still being fetched. */
  institution?: Institution
  adaptations?: Adaptation[]
  /** Highlights the block being edited. The reader's view highlights nothing. */
  activeSubjectId?: string | null
}

/**
 * The sheet with the controls that act on it: how large it is drawn, and the two ways it leaves
 * the screen. The teacher writing the plan and the Director reading it look at the same panel,
 * which is why it is a component of its own rather than a section of the wizard.
 */
export function PdcDocumentPanel({
  plan,
  institution,
  adaptations = [],
  activeSubjectId = null,
}: PdcDocumentPanelProps) {
  const [zoom, setZoom] = useState<number>(DEFAULT_ZOOM)
  const [writing, setWriting] = useState(false)

  const onDownload = () => {
    setWriting(true)
    downloadPdcAsDocx(plan, institution, adaptations)
      .catch(() => toast.error("No se pudo generar el documento de Word."))
      .finally(() => setWriting(false))
  }

  return (
    <section className="min-w-0">
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
          Vista previa
        </p>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            size="icon"
            variant="outline"
            className="size-8"
            title="Alejar"
            aria-label="Alejar la vista previa"
            disabled={zoom === ZOOM_STEPS[0]}
            onClick={() => setZoom(zoomOut(zoom))}
          >
            <ZoomOutIcon className="size-4" />
          </Button>
          <span className="w-10 text-center text-xs text-muted-foreground tabular-nums">
            {Math.round(zoom * 100)}%
          </span>
          <Button
            type="button"
            size="icon"
            variant="outline"
            className="size-8"
            title="Acercar"
            aria-label="Acercar la vista previa"
            disabled={zoom === ZOOM_STEPS[ZOOM_STEPS.length - 1]}
            onClick={() => setZoom(zoomIn(zoom))}
          >
            <ZoomInIcon className="size-4" />
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="ml-2"
            onClick={() => printPdcDocument(planLabel(plan))}
          >
            <PrinterIcon className="size-4" />
            Imprimir o PDF
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={writing}
            onClick={onDownload}
          >
            {writing ? (
              <Loader2Icon className="size-4 animate-spin" />
            ) : (
              <FileDownIcon className="size-4" />
            )}
            Descargar .docx
          </Button>
        </div>
      </div>
      <div className="overflow-x-auto rounded-md border">
        <PdcPreview
          plan={plan}
          institution={institution}
          adaptations={adaptations}
          zoom={zoom}
          activeSubjectId={activeSubjectId}
        />
      </div>
    </section>
  )
}
