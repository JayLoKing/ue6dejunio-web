import type { UseApiCall } from "@/lib/useApicall"
import { loadAbort } from "@/lib/loadAbort"
import { httpClient } from "@/lib/axios"

import { ScoreUrl } from "./scoreServicePath"
import type { RegisterScoreRequest } from "../models/requests/register-score-request"
import type { ScoreResponse } from "../models/response/score-response"

export default class ScoreServiceHelper {
  registerAsync(payload: RegisterScoreRequest): UseApiCall<ScoreResponse> {
    const controller = loadAbort()
    return {
      call: httpClient.post<ScoreResponse>(ScoreUrl.Base, payload, {
        signal: controller.signal,
      }),
      controller,
    }
  }

  byEnrollmentAsync(enrollmentId: string): UseApiCall<ScoreResponse[]> {
    const controller = loadAbort()
    return {
      call: httpClient.get<ScoreResponse[]>(
        ScoreUrl.ByEnrollment(enrollmentId),
        { signal: controller.signal },
      ),
      controller,
    }
  }
}
