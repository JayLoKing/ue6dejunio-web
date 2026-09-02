import { useState } from "react"
import { CheckCircle2Icon, MessageSquareWarningIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"

import type { PdcStatus } from "../types"

/**
 * The states a plan may be answered in. A draft has not been handed in and an approved plan is
 * finished; the API refuses a decision on either, so offering the buttons would promise a 409.
 */
const AWAITING_REVIEW: PdcStatus[] = ["Published", "Under Review"]

export interface PdcReviewActionsProps {
  status: PdcStatus
  /** An answer already on its way. Both move the plan out of review, so a second one is refused. */
  deciding: boolean
  onApprove: () => void
  onObserve: (observations: string) => void
}

/**
 * The Director's two answers to a plan, offered beside the document rather than from the listing —
 * approving a month of work is a decision made with the form in front of you.
 */
export function PdcReviewActions({
  status,
  deciding,
  onApprove,
  onObserve,
}: PdcReviewActionsProps) {
  const [writing, setWriting] = useState(false)
  const [observations, setObservations] = useState("")

  if (!AWAITING_REVIEW.includes(status)) {
    return (
      <p className="text-sm text-muted-foreground">
        Este plan no está esperando revisión.
      </p>
    )
  }

  const said = observations.trim()

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          className="text-emerald-600"
          disabled={deciding}
          onClick={onApprove}
        >
          <CheckCircle2Icon className="size-4" />
          Aprobar
        </Button>
        <Button
          type="button"
          variant="outline"
          className="text-amber-600"
          disabled={deciding}
          onClick={() => setWriting(true)}
        >
          <MessageSquareWarningIcon className="size-4" />
          Observar
        </Button>
      </div>

      {writing ? (
        <div className="flex flex-col gap-2">
          <Textarea
            rows={4}
            placeholder="Describe las observaciones…"
            value={observations}
            onChange={(e) => setObservations(e.target.value)}
          />
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setWriting(false)
                setObservations("")
              }}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              className="bg-univalle text-univalle-foreground hover:bg-univalle/90"
              // Whitespace is not an observation: it would pass a length check here and be
              // refused by the API, which asks the Director to say what has to be corrected.
              disabled={said === "" || deciding}
              onClick={() => onObserve(said)}
            >
              Enviar observación
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
