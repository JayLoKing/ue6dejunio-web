import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import { AdaptationService } from "../services/adaptationService"
import type { CreateAdaptationPayload, UpdateAdaptationPayload } from "../types"

const KEY = ["adaptations"]

/** The significant adaptations of one plan. The wizard step and the preview both read this. */
export function useAdaptationList(planId: string | null) {
  return useQuery({
    queryKey: [...KEY, planId ?? ""],
    queryFn: () => {
      if (!planId) throw new Error("Falta el id del PDC")
      return AdaptationService.list({ planId })
    },
    enabled: Boolean(planId),
  })
}

/**
 * Refreshes what a write touches. Writing an adaptation also changes the plan's
 * `significantAdaptationCount`, and that number is printed by the listing rather than recomputed
 * there — so the plan queries go stale too, not only this plan's adaptations.
 */
function useInvalidate(planId: string) {
  const qc = useQueryClient()
  return () => {
    void qc.invalidateQueries({ queryKey: [...KEY, planId] })
    void qc.invalidateQueries({ queryKey: ["pdc"] })
  }
}

export function useCreateAdaptation(planId: string) {
  const invalidate = useInvalidate(planId)
  return useMutation({
    mutationFn: (p: CreateAdaptationPayload) => AdaptationService.create(p),
    onSuccess: () => {
      toast.success("Adaptación registrada.")
      invalidate()
    },
  })
}

export function useUpdateAdaptation(planId: string) {
  const invalidate = useInvalidate(planId)
  return useMutation({
    mutationFn: (v: { id: string; payload: UpdateAdaptationPayload }) =>
      AdaptationService.update(v.id, v.payload),
    onSuccess: () => {
      toast.success("Adaptación guardada.")
      invalidate()
    },
  })
}

export function useDeleteAdaptation(planId: string) {
  const invalidate = useInvalidate(planId)
  return useMutation({
    mutationFn: (id: string) => AdaptationService.remove(id),
    onSuccess: () => {
      toast.success("Adaptación eliminada.")
      invalidate()
    },
  })
}
