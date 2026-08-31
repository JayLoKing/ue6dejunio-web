import { useMemo } from "react"
import {
  keepPreviousData,
  skipToken,
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
    // `results` es un arreglo nuevo en cada render, así que como dependencia recalcularía
    // siempre. `sig` resume el dataUpdatedAt de cada query y solo cambia cuando llegan datos.
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
  recordedAt: string | null
  updatedAt: string | null
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
        byCe[s.courseEnrollmentId] = {
          id: s.id,
          score: Number(s.score),
          recordedAt: s.recordedAt ?? null,
          updatedAt: s.updatedAt ?? null,
        }
      }
      out[eventId] = byCe
    })
    return out
    // Misma razón que en useCriteriaEvents: `results` cambia de identidad en cada render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventIds, sig])
  return { matrix, isLoading }
}

/**
 * Notas directas de varios criterios a la vez: criterionId → courseEnrollmentId → cell.
 * Espeja a useEventScores. El cuaderno necesita el lote porque arma una columna por
 * criterio; useCriterionScores (singular) sirve a la grilla de un solo criterio.
 */
export function useCriteriaScores(criterionIds: string[]) {
  const results = useQueries({
    queries: criterionIds.map((id) => ({
      queryKey: ["assessment-scores", "criterion", id] as const,
      queryFn: () => AssessmentScoreService.byCriterion(id),
      enabled: Boolean(id),
      staleTime: 30_000,
    })),
  })
  const sig = results.map((r) => r.dataUpdatedAt).join("|")
  const isLoading = results.some((r) => r.isLoading)
  const matrix = useMemo<ScoreMatrix>(() => {
    const out: ScoreMatrix = {}
    results.forEach((r, idx) => {
      const criterionId = criterionIds[idx]
      if (!criterionId) return
      const byCe: Record<string, ScoreCell> = {}
      for (const s of r.data ?? []) {
        byCe[s.courseEnrollmentId] = {
          id: s.id,
          score: Number(s.score),
          recordedAt: s.recordedAt ?? null,
          updatedAt: s.updatedAt ?? null,
        }
      }
      out[criterionId] = byCe
    })
    return out
    // Misma razón que en useCriteriaEvents: `results` cambia de identidad en cada render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [criterionIds, sig])
  return { matrix, isLoading }
}

/**
 * Notas directas de un criterio, para toda la lista del curso.
 * courseEnrollmentId → cell. Espeja a useEventScores para el criterio sin actividad.
 */
export function useCriterionScores(criterionId: string | null) {
  const query = useQuery({
    queryKey: ["assessment-scores", "criterion", criterionId] as const,
    // skipToken en vez de `enabled`: deja el id como string dentro del closure,
    // sin castearlo.
    queryFn: criterionId
      ? () => AssessmentScoreService.byCriterion(criterionId)
      : skipToken,
    staleTime: 30_000,
  })
  const byEnrollment = useMemo<Record<string, ScoreCell>>(() => {
    const out: Record<string, ScoreCell> = {}
    for (const s of query.data ?? []) {
      out[s.courseEnrollmentId] = {
        id: s.id,
        score: Number(s.score),
        recordedAt: s.recordedAt ?? null,
        updatedAt: s.updatedAt ?? null,
      }
    }
    return out
  }, [query.data])
  return { byEnrollment, isLoading: query.isLoading }
}

/** Invalida la lista del destino que corresponda; la nota vive en uno solo de los dos. */
function invalidateScoreTarget(
  qc: ReturnType<typeof useQueryClient>,
  target: { eventId?: string | null; criterionId?: string | null }
) {
  if (target.eventId) {
    void qc.invalidateQueries({
      queryKey: ["assessment-scores", "event", target.eventId],
    })
  }
  if (target.criterionId) {
    void qc.invalidateQueries({
      queryKey: ["assessment-scores", "criterion", target.criterionId],
    })
  }
  void qc.invalidateQueries({ queryKey: ["gradebook"] })
}

export function useSetScore() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (p: SetScorePayload) => AssessmentScoreService.setScore(p),
    onSuccess: (_d, vars) => {
      // Refresca para reflejar la fecha devuelta por el backend.
      invalidateScoreTarget(qc, {
        eventId: vars.id_assessment_event,
        criterionId: vars.id_criterion,
      })
    },
  })
}

/** Casilla vaciada = no calificado: se borra la nota. */
export function useDeleteScore() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (v: {
      id: string
      eventId?: string | null
      criterionId?: string | null
    }) => AssessmentScoreService.remove(v.id),
    onSuccess: (_d, vars) => invalidateScoreTarget(qc, vars),
  })
}
