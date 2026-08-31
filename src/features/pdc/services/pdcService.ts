import PdcServiceHelper, {
  type PdcListParams,
} from "../helpers/pdcServiceHelper"
import type {
  AddProgressPayload,
  CreatePdcPayload,
  Pdc,
  PdcProgress,
  UpdatePdcPayload,
  UpsertPdcSubjectPayload,
} from "../types"
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
  static async create(payload: CreatePdcPayload): Promise<Pdc> {
    const { call } = helper.createAsync(payload)
    return (await call).data
  }
  static async update(id: string, payload: UpdatePdcPayload): Promise<Pdc> {
    const { call } = helper.updateAsync(id, payload)
    return (await call).data
  }
  static async writeSubject(
    id: string,
    planSubjectId: string,
    payload: UpsertPdcSubjectPayload
  ): Promise<Pdc> {
    const { call } = helper.writeSubjectAsync(id, planSubjectId, payload)
    return (await call).data
  }
  static async copyToParallels(id: string): Promise<Pdc[]> {
    const { call } = helper.copyToParallelsAsync(id)
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
  static async addProgress(
    id: string,
    payload: AddProgressPayload
  ): Promise<PdcProgress> {
    return (await helper.addProgressAsync(id, payload).call).data
  }
  static async listProgress(id: string): Promise<PdcProgress[]> {
    return (await helper.listProgressAsync(id).call).data
  }
}
