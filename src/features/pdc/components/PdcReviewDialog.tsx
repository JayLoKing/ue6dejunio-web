import { Loader2Icon } from "lucide-react"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useInstitution } from "@/features/institution/hooks/useInstitution"
import { useAdaptationList } from "@/features/adaptation/hooks/useAdaptations"

import { PdcDocumentPanel } from "./PdcDocumentPanel"
import { PdcReviewActions } from "./PdcReviewActions"
import { usePdcAction, usePdcDetail } from "../hooks/usePdc"
import { planLabel } from "../utils/planLabel"

export interface PdcReviewDialogProps {
  /** The plan being read. Null closes the dialog back to the listing. */
  planId: string | null
  onClose: () => void
}

/**
 * The plan as the Director reads it: the handed-in document, whole, and the two answers they may
 * give it. Read-only — reviewing is not editing, and the API refuses a Director's write anyway.
 *
 * <p>The blocks and the weekly rows only travel with the detail, never with a listing row, which
 * is why this fetches the plan again rather than taking the row it was opened from.
 */
export function PdcReviewDialog({ planId, onClose }: PdcReviewDialogProps) {
  const detail = usePdcDetail(planId)
  const institution = useInstitution()
  const adaptations = useAdaptationList(planId)
  const { approve, observe } = usePdcAction()

  const plan = detail.data
  const deciding = approve.isPending || observe.isPending

  return (
    <Dialog open={Boolean(planId)} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-[95vw]">
        <DialogHeader>
          <DialogTitle>
            {plan ? planLabel(plan) : "Plan de Desarrollo Curricular"}
          </DialogTitle>
        </DialogHeader>

        {detail.isLoading || !plan ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2Icon className="size-4 animate-spin" /> Cargando el plan…
          </div>
        ) : (
          <div className="flex min-w-0 flex-col gap-4">
            {/* What was already said about this plan. A plan sent back and handed in again carries
                the previous round's observations, and reviewing it without them reads as a first
                submission. */}
            {plan.reviewObservations ? (
              <div className="rounded-md border border-amber-500/30 bg-amber-500/10 p-3 text-sm">
                <p className="font-semibold text-amber-600">
                  Observaciones anteriores
                </p>
                <p className="whitespace-pre-wrap">{plan.reviewObservations}</p>
              </div>
            ) : null}

            <PdcReviewActions
              status={plan.status}
              deciding={deciding}
              onApprove={() => approve.mutate(plan.id, { onSuccess: onClose })}
              onObserve={(observations) =>
                observe.mutate(
                  { id: plan.id, observations },
                  { onSuccess: onClose }
                )
              }
            />

            <PdcDocumentPanel
              plan={plan}
              institution={institution.data}
              adaptations={adaptations.data?.content ?? []}
            />
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
