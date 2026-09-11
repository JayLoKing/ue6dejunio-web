import {
  skipToken,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query"
import { toast } from "sonner"

import { RiskService } from "../services/riskService"
import { describeRun } from "../utils/runSummary"

/**
 * Everything the panel reads, under one root key.
 *
 * A run over one subject moves rows that the course listing and the student view are also
 * showing, so a write invalidates the root rather than the exact key it touched. Three lists of
 * the same predictions where one is stale is worse than one refetch.
 */
const RISK_KEY = "risk"

function useInvalidateRisk() {
  const qc = useQueryClient()
  return () => {
    void qc.invalidateQueries({ queryKey: [RISK_KEY] })
  }
}

export function useClassGroupRisk(
  classGroupId: string | null | undefined,
  trimester: number
) {
  return useQuery({
    queryKey: [RISK_KEY, "class-group", classGroupId ?? "", trimester],
    queryFn: classGroupId
      ? () => RiskService.byClassGroup(classGroupId, trimester)
      : skipToken,
  })
}

export function useCourseRisk(
  courseId: string | null | undefined,
  trimester: number
) {
  return useQuery({
    queryKey: [RISK_KEY, "course", courseId ?? "", trimester],
    queryFn: courseId
      ? () => RiskService.byCourse(courseId, trimester)
      : skipToken,
  })
}

export function usePredictClassGroupRisk() {
  const invalidate = useInvalidateRisk()
  return useMutation({
    mutationFn: (v: { classGroupId: string; trimester: number }) =>
      RiskService.predictClassGroup(v.classGroupId, v.trimester),
    onSuccess: (summary) => {
      const { tone, message } = describeRun(summary)
      toast[tone](message)
      invalidate()
    },
  })
}

/** The sweep over the whole gestión. The Director's, and slow: it runs the model school-wide. */
export function usePredictYearRisk() {
  const invalidate = useInvalidateRisk()
  return useMutation({
    mutationFn: (v: { academicYear: number; trimester: number }) =>
      RiskService.predictYear(v.academicYear, v.trimester),
    onSuccess: (summary) => {
      const { tone, message } = describeRun(summary)
      toast[tone](message)
      invalidate()
    },
  })
}

export function useMarkRiskAttended() {
  const invalidate = useInvalidateRisk()
  return useMutation({
    mutationFn: (v: { id: string; attended: boolean }) =>
      RiskService.markAttended(v.id, v.attended),
    onSuccess: (_prediction, v) => {
      toast.success(
        v.attended ? "Marcado como atendido." : "Marcado como pendiente."
      )
      invalidate()
    },
  })
}
