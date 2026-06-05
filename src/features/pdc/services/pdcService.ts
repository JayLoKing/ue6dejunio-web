import PdcServiceHelper, {
  type PdcListParams,
} from "../helpers/pdcServiceHelper"
import type { Pdc, PdcFormPayload } from "../types"
import type { PagedResponse } from "@/lib/types/pagination"

export type { PdcListParams }

const helper = new PdcServiceHelper()

export class PdcService {
  static async list(params: PdcListParams): Promise<PagedResponse<Pdc>> {
    const { call } = helper.listAsync(params)
    return (await call).data
  }
  static async getById(id: string): Promise<Pdc> {
    const { call } = helper.getByIdAsync(id)
    return (await call).data
  }
  static async create(payload: PdcFormPayload): Promise<Pdc> {
    const { call } = helper.createAsync(payload)
    return (await call).data
  }
  static async update(
    id: string,
    payload: Omit<PdcFormPayload, "id_class_group" | "trimester">,
  ): Promise<Pdc> {
    const { call } = helper.updateAsync(id, payload)
    return (await call).data
  }
  static async publish(id: string): Promise<Pdc> {
    const { call } = helper.publishAsync(id)
    return (await call).data
  }
  static async approve(id: string): Promise<Pdc> {
    const { call } = helper.approveAsync(id)
    return (await call).data
  }
  static async observe(id: string, observations: string): Promise<Pdc> {
    const { call } = helper.observeAsync(id, observations)
    return (await call).data
  }
  static async remove(id: string): Promise<void> {
    await helper.removeAsync(id).call
  }
}
