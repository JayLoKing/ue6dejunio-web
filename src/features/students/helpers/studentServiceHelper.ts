import type { UseApiCall } from "@/lib/useApicall"
import { loadAbort } from "@/lib/loadAbort"
import { httpClient } from "@/lib/axios"

import { EnrollmentUrl } from "./studentServicePath"
import type {
  EnrollBatchRequest,
  EnrollSingleRequest,
} from "../models/requests/enroll-request"
import type { EnrollResponse } from "../models/response/enroll-response"

export default class StudentServiceHelper {
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
