import ScoreServiceHelper from "../helpers/scoreServiceHelper"
import type { RegisterScoreRequest } from "../models/requests/register-score-request"
import type { ScoreResponse } from "../models/response/score-response"

const helper = new ScoreServiceHelper()

export class ScoreService {
  static async register(payload: RegisterScoreRequest): Promise<ScoreResponse> {
    const { call } = helper.registerAsync(payload)
    const response = await call
    return response.data
  }

  static async byEnrollment(enrollmentId: string): Promise<ScoreResponse[]> {
    const { call } = helper.byEnrollmentAsync(enrollmentId)
    const response = await call
    return response.data
  }
}
