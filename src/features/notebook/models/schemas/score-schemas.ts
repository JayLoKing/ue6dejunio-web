import { z } from "zod"

import { DIMENSION_WEIGHTS } from "../../types"

export const registerScoreSchema = z.object({
  id_enrollment: z.string().uuid(),
  trimester: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  scoreBeing: z.number().min(0).max(DIMENSION_WEIGHTS.SER),
  scoreKnowing: z.number().min(0).max(DIMENSION_WEIGHTS.SABER),
  scoreDoing: z.number().min(0).max(DIMENSION_WEIGHTS.HACER),
  scoreDeciding: z.number().min(0).max(DIMENSION_WEIGHTS.AUTO),
})

export type RegisterScoreValues = z.infer<typeof registerScoreSchema>
