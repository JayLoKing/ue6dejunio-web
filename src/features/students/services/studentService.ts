import StudentServiceHelper from "../helpers/studentServiceHelper"
import type {
  EnrollBatchRequest,
  EnrollSingleRequest,
} from "../models/requests/enroll-request"
import type { EnrollResponse } from "../models/response/enroll-response"

const helper = new StudentServiceHelper()

export class StudentService {
  static async enrollSingle(
    payload: EnrollSingleRequest
  ): Promise<EnrollResponse> {
    const { call } = helper.enrollSingleAsync(payload)
    const { data } = await call
    return data
  }

  static async enrollBatch(
    payload: EnrollBatchRequest
  ): Promise<EnrollResponse> {
    const { call } = helper.enrollBatchAsync(payload)
    const { data } = await call
    return data
  }
}
