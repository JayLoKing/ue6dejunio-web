import type { UseApiCall } from "@/lib/useApicall"
import { loadAbort } from "@/lib/loadAbort"
import { httpClient } from "@/lib/axios"

import { ClassGroupUrl } from "./classGroupServicePath"
import type { CreateClassGroupRequest } from "../models/requests/create-class-group-request"
import type { CreateClassGroupResponse } from "../models/response/class-group-response"

export default class ClassGroupServiceHelper {
  createAsync(
    payload: CreateClassGroupRequest,
  ): UseApiCall<CreateClassGroupResponse> {
    const controller = loadAbort()
    return {
      call: httpClient.post<CreateClassGroupResponse>(
        ClassGroupUrl.Base,
        payload,
        { signal: controller.signal },
      ),
      controller,
    }
  }
}
