import type { UseApiCall } from "@/lib/useApicall"
import { loadAbort } from "@/lib/loadAbort"
import { httpClient } from "@/lib/axios"
import type { PagedResponse } from "@/lib/types/pagination"

import { PdcUrl } from "./pdcServicePath"
import type {
  AddProgressPayload,
  Pdc,
  PdcFormPayload,
  PdcProgress,
} from "../types"

export interface PdcListParams {
  classGroupId?: string
  trimester?: number
  status?: string
  offset?: number
  limit?: number
}

export type PdcUpdatePayload = Omit<
  PdcFormPayload,
  "id_class_group" | "trimester"
>

export default class PdcServiceHelper {
  listAsync(params: PdcListParams): UseApiCall<PagedResponse<Pdc>> {
    const controller = loadAbort()
    return {
      call: httpClient.get<PagedResponse<Pdc>>(PdcUrl.Base, {
        signal: controller.signal,
        params: {
          id_class_group: params.classGroupId,
          trimester: params.trimester,
          status: params.status,
          offset: params.offset ?? 1,
          limit: params.limit ?? 20,
        },
      }),
      controller,
    }
  }

  getByIdAsync(id: string): UseApiCall<Pdc> {
    const controller = loadAbort()
    return {
      call: httpClient.get<Pdc>(PdcUrl.ById(id), {
        signal: controller.signal,
      }),
      controller,
    }
  }

  createAsync(payload: PdcFormPayload): UseApiCall<Pdc> {
    const controller = loadAbort()
    return {
      call: httpClient.post<Pdc>(PdcUrl.Base, payload, {
        signal: controller.signal,
      }),
      controller,
    }
  }

  updateAsync(id: string, payload: PdcUpdatePayload): UseApiCall<Pdc> {
    const controller = loadAbort()
    return {
      call: httpClient.put<Pdc>(PdcUrl.ById(id), payload, {
        signal: controller.signal,
      }),
      controller,
    }
  }

  publishAsync(id: string): UseApiCall<Pdc> {
    const controller = loadAbort()
    return {
      call: httpClient.post<Pdc>(PdcUrl.Publish(id), null, {
        signal: controller.signal,
      }),
      controller,
    }
  }

  approveAsync(id: string): UseApiCall<Pdc> {
    const controller = loadAbort()
    return {
      call: httpClient.post<Pdc>(PdcUrl.Approve(id), null, {
        signal: controller.signal,
      }),
      controller,
    }
  }

  observeAsync(id: string, observations: string): UseApiCall<Pdc> {
    const controller = loadAbort()
    return {
      call: httpClient.post<Pdc>(
        PdcUrl.Observe(id),
        { observations },
        { signal: controller.signal },
      ),
      controller,
    }
  }

  removeAsync(id: string): UseApiCall<void> {
    const controller = loadAbort()
    return {
      call: httpClient.delete<void>(PdcUrl.ById(id), {
        signal: controller.signal,
      }),
      controller,
    }
  }

  addProgressAsync(
    id: string,
    payload: AddProgressPayload,
  ): UseApiCall<PdcProgress> {
    const controller = loadAbort()
    return {
      call: httpClient.post<PdcProgress>(PdcUrl.Progress(id), payload, {
        signal: controller.signal,
      }),
      controller,
    }
  }

  listProgressAsync(id: string): UseApiCall<PdcProgress[]> {
    const controller = loadAbort()
    return {
      call: httpClient.get<PdcProgress[]>(PdcUrl.Progress(id), {
        signal: controller.signal,
      }),
      controller,
    }
  }
}
