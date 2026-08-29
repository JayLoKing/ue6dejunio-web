import type { UseApiCall } from "@/lib/useApicall"
import { loadAbort } from "@/lib/loadAbort"
import { httpClient } from "@/lib/axios"

import { InstitutionUrl } from "./institutionServicePath"
import type { Institution } from "../types"

export default class InstitutionServiceHelper {
  currentAsync(): UseApiCall<Institution> {
    const controller = loadAbort()
    return {
      call: httpClient.get<Institution>(InstitutionUrl.Base, {
        signal: controller.signal,
      }),
      controller,
    }
  }
}
