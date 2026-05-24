import { useMutation } from "@tanstack/react-query"
import { toast } from "sonner"

import { ScoreService } from "../services/scoreService"
import type { RegisterScoreRequest } from "../models/requests/register-score-request"
import type { ScoreResponse } from "../models/response/score-response"

export function useRegisterScore() {
  return useMutation<ScoreResponse, Error, RegisterScoreRequest>({
    mutationFn: (payload) => ScoreService.register(payload),
    onSuccess: () => toast.success("Nota guardada."),
  })
}
