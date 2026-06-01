import { httpClient } from "@/lib/axios"
import type { PagedResponse, PageQuery } from "@/lib/types/pagination"
import { toPageParams } from "@/lib/types/pagination"

import type { Grade, Level, Parallel, Subject } from "../types"

// ---- Levels ----
export class LevelService {
  static async list(q: PageQuery): Promise<PagedResponse<Level>> {
    const { data } = await httpClient.get<PagedResponse<Level>>("/levels", {
      params: toPageParams(q),
    })
    return data
  }
  static async create(payload: { name: string }): Promise<Level> {
    const { data } = await httpClient.post<Level>("/levels", payload)
    return data
  }
  static async update(id: number, payload: { name: string }): Promise<Level> {
    const { data } = await httpClient.put<Level>(`/levels/${id}`, payload)
    return data
  }
  static async remove(id: number): Promise<void> {
    await httpClient.delete(`/levels/${id}`)
  }
}

// ---- Grades ----
export class GradeAdminService {
  static async list(q: PageQuery): Promise<PagedResponse<Grade>> {
    const { data } = await httpClient.get<PagedResponse<Grade>>("/grades", {
      params: toPageParams(q),
    })
    return data
  }
  static async create(payload: {
    name: string
    id_level: number
  }): Promise<Grade> {
    const { data } = await httpClient.post<Grade>("/grades", payload)
    return data
  }
  static async update(
    id: number,
    payload: { name: string; id_level: number },
  ): Promise<Grade> {
    const { data } = await httpClient.put<Grade>(`/grades/${id}`, payload)
    return data
  }
  static async remove(id: number): Promise<void> {
    await httpClient.delete(`/grades/${id}`)
  }
}

// ---- Parallels ----
export class ParallelService {
  static async list(q: PageQuery): Promise<PagedResponse<Parallel>> {
    const { data } = await httpClient.get<PagedResponse<Parallel>>(
      "/parallels",
      { params: toPageParams(q) },
    )
    return data
  }
  static async create(payload: { name: string }): Promise<Parallel> {
    const { data } = await httpClient.post<Parallel>("/parallels", payload)
    return data
  }
  static async update(
    id: number,
    payload: { name: string },
  ): Promise<Parallel> {
    const { data } = await httpClient.put<Parallel>(`/parallels/${id}`, payload)
    return data
  }
  static async remove(id: number): Promise<void> {
    await httpClient.delete(`/parallels/${id}`)
  }
}

// ---- Subjects ----
export class SubjectAdminService {
  static async list(q: PageQuery): Promise<PagedResponse<Subject>> {
    const { data } = await httpClient.get<PagedResponse<Subject>>("/subjects", {
      params: toPageParams(q),
    })
    return data
  }
  static async create(payload: {
    name: string
    area: string
  }): Promise<Subject> {
    const { data } = await httpClient.post<Subject>("/subjects", payload)
    return data
  }
  static async update(
    id: string,
    payload: { name?: string; area?: string; active?: boolean },
  ): Promise<Subject> {
    const { data } = await httpClient.put<Subject>(`/subjects/${id}`, payload)
    return data
  }
  static async remove(id: string): Promise<void> {
    await httpClient.delete(`/subjects/${id}`)
  }
}
