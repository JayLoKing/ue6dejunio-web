import { useQuery } from "@tanstack/react-query"

import { ScoreService } from "../services/scoreService"

export const scoresKey = (enrollmentId: string) =>
  ["scores", "enrollment", enrollmentId] as const

export function useScoresByEnrollment(enrollmentId: string | null) {
  return useQuery({
    queryKey: scoresKey(enrollmentId ?? ""),
    enabled: Boolean(enrollmentId),
    queryFn: () => ScoreService.byEnrollment(enrollmentId as string),
    staleTime: 30_000,
  })
}
