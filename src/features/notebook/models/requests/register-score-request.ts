export interface RegisterScoreRequest {
  id_enrollment: string
  trimester: 1 | 2 | 3
  scoreBeing: number
  scoreKnowing: number
  scoreDoing: number
  scoreDeciding: number
}
