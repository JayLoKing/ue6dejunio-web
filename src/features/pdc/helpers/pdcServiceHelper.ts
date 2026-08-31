import type { UseApiCall } from "@/lib/useApicall"
import { loadAbort } from "@/lib/loadAbort"
import { httpClient } from "@/lib/axios"
import type { PagedResponse } from "@/lib/types/pagination"

import { PdcUrl } from "./pdcServicePath"
import type {
  AddProgressPayload,
  CreatePdcPayload,
  Pdc,
  PdcProgress,
  UpdatePdcPayload,
  UpsertPdcSubjectPayload,
} from "../types"

export interface PdcListParams {
  courseId?: string
  trimester?: number
  status?: string
  offset?: number
  limit?: number
}

export default class PdcServiceHelper {
  listAsync(params: PdcListParams): UseApiCall<PagedResponse<Pdc>> {
    const controller = loadAbort()
    return {
      call: httpClient.get<PagedResponse<Pdc>>(PdcUrl.Base, {
        signal: controller.signal,
        params: {
          id_course: params.courseId,
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

  createAsync(payload: CreatePdcPayload): UseApiCall<Pdc> {
    const controller = loadAbort()
    return {
      call: httpClient.post<Pdc>(PdcUrl.Base, payload, {
        signal: controller.signal,
      }),
      controller,
    }
  }

  updateAsync(id: string, payload: UpdatePdcPayload): UseApiCall<Pdc> {
    const controller = loadAbort()
    return {
      call: httpClient.put<Pdc>(PdcUrl.ById(id), payload, {
        signal: controller.signal,
      }),
      controller,
    }
  }

  /** Saves one subject's block. Returns the whole plan, so the preview stays in step with it. */
  writeSubjectAsync(
    id: string,
    planSubjectId: string,
    payload: UpsertPdcSubjectPayload
  ): UseApiCall<Pdc> {
    const controller = loadAbort()
    return {
      call: httpClient.put<Pdc>(PdcUrl.Subject(id, planSubjectId), payload, {
        signal: controller.signal,
      }),
      controller,
    }
  }

  copyToParallelsAsync(id: string): UseApiCall<Pdc[]> {
    const controller = loadAbort()
    return {
      call: httpClient.post<Pdc[]>(PdcUrl.CopyToParallels(id), null, {
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
        { signal: controller.signal }
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
    payload: AddProgressPayload
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
