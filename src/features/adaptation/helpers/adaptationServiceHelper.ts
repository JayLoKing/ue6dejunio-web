import type { UseApiCall } from "@/lib/useApicall"
import { loadAbort } from "@/lib/loadAbort"
import { httpClient } from "@/lib/axios"
import type { PagedResponse } from "@/lib/types/pagination"

import { AdaptationUrl } from "./adaptationServicePath"
import type {
  Adaptation,
  CreateAdaptationPayload,
  UpdateAdaptationPayload,
} from "../types"

export interface AdaptationListParams {
  planId: string
  offset?: number
  limit?: number
}

export default class AdaptationServiceHelper {
  /** Always scoped to a plan: the server has no listing that spans every course. */
  listAsync(
    params: AdaptationListParams
  ): UseApiCall<PagedResponse<Adaptation>> {
    const controller = loadAbort()
    return {
      call: httpClient.get<PagedResponse<Adaptation>>(AdaptationUrl.Base, {
        signal: controller.signal,
        params: {
          id_curriculum_plan: params.planId,
          offset: params.offset ?? 1,
          limit: params.limit ?? 20,
        },
      }),
      controller,
    }
  }

  getByIdAsync(id: string): UseApiCall<Adaptation> {
    const controller = loadAbort()
    return {
      call: httpClient.get<Adaptation>(AdaptationUrl.ById(id), {
        signal: controller.signal,
      }),
      controller,
    }
  }

  createAsync(payload: CreateAdaptationPayload): UseApiCall<Adaptation> {
    const controller = loadAbort()
    return {
      call: httpClient.post<Adaptation>(AdaptationUrl.Base, payload, {
        signal: controller.signal,
      }),
      controller,
    }
  }

  updateAsync(
    id: string,
    payload: UpdateAdaptationPayload
  ): UseApiCall<Adaptation> {
    const controller = loadAbort()
    return {
      call: httpClient.put<Adaptation>(AdaptationUrl.ById(id), payload, {
        signal: controller.signal,
      }),
      controller,
    }
  }

  removeAsync(id: string): UseApiCall<void> {
    const controller = loadAbort()
    return {
      call: httpClient.delete<void>(AdaptationUrl.ById(id), {
        signal: controller.signal,
      }),
      controller,
    }
  }
}
