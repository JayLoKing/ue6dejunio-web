import { useMemo } from "react"
import {
  keepPreviousData,
  useMutation,
  useQueries,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query"
import { toast } from "sonner"

import {
  AssessmentEventService,
  AssessmentScoreService,
  CriterionService,
} from "../services/assessmentService"
import type {
  AssessmentEvent,
  CreateCriterionPayload,
  CreateEventPayload,
  Criterion,
  SetScorePayload,
  UpdateCriterionPayload,
  UpdateEventPayload,
} from "../types"

// ---------- Criteria ----------
export function useCriteria(classGroupId: string, trimester: number) {
  return useQuery({
    queryKey: ["criteria", classGroupId, trimester],
    queryFn: () => CriterionService.list(classGroupId, trimester),
    enabled: Boolean(classGroupId),
    placeholderData: keepPreviousData,
  })
}

function useCriteriaInvalidate() {
  const qc = useQueryClient()
  return () => void qc.invalidateQueries({ queryKey: ["criteria"] })
}

export function useCreateCriterion() {
  const invalidate = useCriteriaInvalidate()
  return useMutation({
    mutationFn: (p: CreateCriterionPayload) => CriterionService.create(p),
    onSuccess: () => {
      toast.success("Criterio creado.")
      invalidate()
    },
  })
}
export function useUpdateCriterion() {
  const invalidate = useCriteriaInvalidate()
  return useMutation({
    mutationFn: (v: { id: string; payload: UpdateCriterionPayload }) =>
      CriterionService.update(v.id, v.payload),
    onSuccess: () => {
      toast.success("Criterio actualizado.")
      invalidate()
    },
  })
}
export function useDeleteCriterion() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => CriterionService.remove(id),
    onSuccess: () => {
      toast.success("Criterio eliminado.")
      void qc.invalidateQueries({ queryKey: ["criteria"] })
      void qc.invalidateQueries({ queryKey: ["assessment-events"] })
      void qc.invalidateQueries({ queryKey: ["gradebook"] })
    },
  })
}

// ---------- Events (activities) per criterion ----------
/** eventos por criterio → { criterionId: AssessmentEvent[] } */
export function useCriteriaEvents(criteria: Criterion[]) {
  const results = useQueries({
    queries: criteria.map((c) => ({
      queryKey: ["assessment-events", c.id] as const,
      queryFn: () => AssessmentEventService.list(c.id),
      enabled: Boolean(c.id),
      staleTime: 30_000,
    })),
  })
  const sig = results.map((r) => r.dataUpdatedAt).join("|")
  const isLoading = results.some((r) => r.isLoading)
  const byCriterion = useMemo<Record<string, AssessmentEvent[]>>(() => {
    const out: Record<string, AssessmentEvent[]> = {}
    results.forEach((r, i) => {
      const c = criteria[i]
      if (c) out[c.id] = r.data ?? []
    })
    return out
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [criteria, sig])
  return { byCriterion, isLoading }
}

function useEventsInvalidate() {
  const qc = useQueryClient()
  return () => {
    void qc.invalidateQueries({ queryKey: ["assessment-events"] })
    void qc.invalidateQueries({ queryKey: ["gradebook"] })
  }
}

export function useCreateEvent() {
  const invalidate = useEventsInvalidate()
  return useMutation({
    mutationFn: (p: CreateEventPayload) => AssessmentEventService.create(p),
    onSuccess: () => {
      toast.success("Actividad creada.")
      invalidate()
    },
  })
}
export function useUpdateEvent() {
  const invalidate = useEventsInvalidate()
  return useMutation({
    mutationFn: (v: { id: string; payload: UpdateEventPayload }) =>
      AssessmentEventService.update(v.id, v.payload),
    onSuccess: () => {
      toast.success("Actividad actualizada.")
      invalidate()
    },
  })
}
export function useDeleteEvent() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => AssessmentEventService.remove(id),
    onSuccess: () => {
      toast.success("Actividad eliminada.")
      void qc.invalidateQueries({ queryKey: ["assessment-events"] })
      void qc.invalidateQueries({ queryKey: ["assessment-scores"] })
      void qc.invalidateQueries({ queryKey: ["gradebook"] })
    },
  })
}

// ---------- Scores ----------
export interface ScoreCell {
  id: string
  score: number
}
/** eventId → courseEnrollmentId → cell */
export type ScoreMatrix = Record<string, Record<string, ScoreCell>>

export function useEventScores(eventIds: string[]) {
  const results = useQueries({
    queries: eventIds.map((id) => ({
      queryKey: ["assessment-scores", "event", id] as const,
      queryFn: () => AssessmentScoreService.byEvent(id),
      enabled: Boolean(id),
      staleTime: 30_000,
    })),
  })
  const sig = results.map((r) => r.dataUpdatedAt).join("|")
  const isLoading = results.some((r) => r.isLoading)
  const matrix = useMemo<ScoreMatrix>(() => {
    const out: ScoreMatrix = {}
    results.forEach((r, idx) => {
      const eventId = eventIds[idx]
      if (!eventId) return
      const byCe: Record<string, ScoreCell> = {}
      for (const s of r.data ?? []) {
        byCe[s.courseEnrollmentId] = { id: s.id, score: Number(s.score) }
      }
      out[eventId] = byCe
    })
    return out
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventIds, sig])
  return { matrix, isLoading }
}

export function useSetScore() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (p: SetScorePayload) => AssessmentScoreService.setScore(p),
    onSuccess: (_d, vars) => {
      void qc.invalidateQueries({
        queryKey: ["assessment-scores", "event", vars.id_assessment_event],
      })
      void qc.invalidateQueries({ queryKey: ["gradebook"] })
    },
  })
}
