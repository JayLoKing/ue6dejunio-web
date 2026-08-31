import AdaptationServiceHelper, {
  type AdaptationListParams,
} from "../helpers/adaptationServiceHelper"
import type {
  Adaptation,
  CreateAdaptationPayload,
  UpdateAdaptationPayload,
} from "../types"
import type { PagedResponse } from "@/lib/types/pagination"

export type { AdaptationListParams }

const helper = new AdaptationServiceHelper()

export class AdaptationService {
  static async list(
    params: AdaptationListParams
  ): Promise<PagedResponse<Adaptation>> {
    const { call } = helper.listAsync(params)
    return (await call).data
  }
  static async getById(id: string): Promise<Adaptation> {
    const { call } = helper.getByIdAsync(id)
    return (await call).data
  }
  static async create(payload: CreateAdaptationPayload): Promise<Adaptation> {
    const { call } = helper.createAsync(payload)
    return (await call).data
  }
  static async update(
    id: string,
    payload: UpdateAdaptationPayload
  ): Promise<Adaptation> {
    const { call } = helper.updateAsync(id, payload)
    return (await call).data
  }
  static async remove(id: string): Promise<void> {
    await helper.removeAsync(id).call
  }
}
