import { httpClient } from "@/lib/axios"
import type { PagedResponse } from "@/lib/types/pagination"

import type { Pdc, PdcFormPayload } from "../types"

export interface PdcListParams {
  classGroupId?: string
  trimester?: number
  status?: string
  offset?: number
  limit?: number
}

export class PdcService {
  static async list(params: PdcListParams): Promise<PagedResponse<Pdc>> {
    const { data } = await httpClient.get<PagedResponse<Pdc>>("/pdc", {
      params: {
        id_class_group: params.classGroupId,
        trimester: params.trimester,
        status: params.status,
        offset: params.offset ?? 1,
        limit: params.limit ?? 20,
      },
    })
    return data
  }
  static async getById(id: string): Promise<Pdc> {
    const { data } = await httpClient.get<Pdc>(`/pdc/${id}`)
    return data
  }
  static async create(payload: PdcFormPayload): Promise<Pdc> {
    const { data } = await httpClient.post<Pdc>("/pdc", payload)
    return data
  }
  static async update(
    id: string,
    payload: Omit<PdcFormPayload, "id_class_group" | "trimester">,
  ): Promise<Pdc> {
    const { data } = await httpClient.put<Pdc>(`/pdc/${id}`, payload)
    return data
  }
  static async publish(id: string): Promise<Pdc> {
    const { data } = await httpClient.post<Pdc>(`/pdc/${id}/publish`)
    return data
  }
  static async approve(id: string): Promise<Pdc> {
    const { data } = await httpClient.post<Pdc>(`/pdc/${id}/approve`)
    return data
  }
  static async observe(id: string, observations: string): Promise<Pdc> {
    const { data } = await httpClient.post<Pdc>(`/pdc/${id}/observe`, {
      observations,
    })
    return data
  }
  static async remove(id: string): Promise<void> {
    await httpClient.delete(`/pdc/${id}`)
  }
}
