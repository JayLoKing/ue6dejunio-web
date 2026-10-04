import type { UseApiCall } from "@/lib/useApicall"
import { loadAbort } from "@/lib/loadAbort"
import { httpClient } from "@/lib/axios"

import { HandoverUrl } from "./handoverServicePath"
import type { StartHandoverRequest } from "../models/requests/handover-request"
import type {
  DirectorHandover,
  UserLookup,
} from "../models/response/handover-response"

/** Los dos GET contestan 204 sin cuerpo cuando no hay nada: `data` llega vacío y no un objeto. */
export default class HandoverServiceHelper {
  pendingAsync(): UseApiCall<DirectorHandover | ""> {
    const controller = loadAbort()
    return {
      call: httpClient.get<DirectorHandover | "">(HandoverUrl.Base, {
        signal: controller.signal,
      }),
      controller,
    }
  }

  lookupAsync(email: string): UseApiCall<UserLookup | ""> {
    const controller = loadAbort()
    return {
      call: httpClient.get<UserLookup | "">(HandoverUrl.Lookup, {
        params: { email },
        signal: controller.signal,
      }),
      controller,
    }
  }

  startAsync(payload: StartHandoverRequest): UseApiCall<DirectorHandover> {
    const controller = loadAbort()
    return {
      call: httpClient.post<DirectorHandover>(HandoverUrl.Base, payload, {
        signal: controller.signal,
      }),
      controller,
    }
  }

  cancelAsync(): UseApiCall<void> {
    const controller = loadAbort()
    return {
      call: httpClient.delete<void>(HandoverUrl.Base, {
        signal: controller.signal,
      }),
      controller,
    }
  }
}
