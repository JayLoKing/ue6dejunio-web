import { useState } from "react"
import {
  FileDownIcon,
  PrinterIcon,
  ZoomInIcon,
  ZoomOutIcon,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import type { Institution } from "@/features/institution/types"
import type { Adaptation } from "@/features/adaptation/types"

import { PDC_DOCUMENT_ID, PdcPreview } from "./PdcPreview"
import type { Pdc } from "../types"
import { planLabel } from "../utils/planLabel"
import { wordDocumentOf } from "../utils/wordDocument"
import { DEFAULT_ZOOM, ZOOM_STEPS, zoomIn, zoomOut } from "../utils/zoom"

/**
 * Hands the document over as a file Word opens. What is saved is the preview's own markup, so the
 * file says exactly what was on screen — there is no second rendering to keep in step.
 */
function downloadPdcAsWord(plan: Pdc) {
  const document_ = document.getElementById(PDC_DOCUMENT_ID)
  if (!document_) return

  const title = planLabel(plan)
  const blob = new Blob([wordDocumentOf(document_.innerHTML, title)], {
    type: "application/msword",
  })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = `${title}.doc`
  link.click()
  URL.revokeObjectURL(url)
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
            onClick={() => window.print()}
          >
            <PrinterIcon className="size-4" />
            Imprimir o PDF
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => downloadPdcAsWord(plan)}
          >
            <FileDownIcon className="size-4" />
            Descargar .doc
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
