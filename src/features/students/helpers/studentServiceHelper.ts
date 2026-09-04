import type { UseApiCall } from "@/lib/useApicall"
import { loadAbort } from "@/lib/loadAbort"
import { httpClient } from "@/lib/axios"

import { EnrollmentUrl, StudentUrl } from "./studentServicePath"
import type {
  EnrollBatchRequest,
  EnrollSingleRequest,
} from "../models/requests/enroll-request"
import type { WithdrawStudentRequest } from "../models/requests/withdraw-request"
import type { EnrollResponse } from "../models/response/enroll-response"
import type { StudentDetail } from "../types"

export default class StudentServiceHelper {
  getByIdAsync(id: string): UseApiCall<StudentDetail> {
    const controller = loadAbort()
    return {
      call: httpClient.get<StudentDetail>(StudentUrl.ById(id), {
        signal: controller.signal,
      }),
      controller,
    }
  }

  withdrawAsync(
    id: string,
    payload: WithdrawStudentRequest
  ): UseApiCall<void> {
    const controller = loadAbort()
    return {
      call: httpClient.post<void>(StudentUrl.Withdraw(id), payload, {
        signal: controller.signal,
      }),
      controller,
    }
  }

  enrollSingleAsync(payload: EnrollSingleRequest): UseApiCall<EnrollResponse> {
    const controller = loadAbort()
    return {
      call: httpClient.post<EnrollResponse>(EnrollmentUrl.Single, payload, {
        signal: controller.signal,
      }),
      controller,
    }
  }

  enrollBatchAsync(payload: EnrollBatchRequest): UseApiCall<EnrollResponse> {
    const controller = loadAbort()
    return {
      call: httpClient.post<EnrollResponse>(EnrollmentUrl.Sync, payload, {
        signal: controller.signal,
      }),
      controller,
    }
  }
}
