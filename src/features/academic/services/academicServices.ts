import type { PagedResponse, PageQuery } from "@/lib/types/pagination"

import {
  GradeServiceHelper,
  KnowledgeAreaServiceHelper,
  LevelServiceHelper,
  ParallelServiceHelper,
  SubjectServiceHelper,
  TrimesterPeriodServiceHelper,
} from "../helpers/academicServiceHelper"
import type {
  CreateTrimesterPeriodPayload,
  Grade,
  KnowledgeArea,
  Level,
  Parallel,
  Subject,
  TrimesterPeriod,
  UpdateTrimesterPeriodPayload,
} from "../types"

const levelHelper = new LevelServiceHelper()
const gradeHelper = new GradeServiceHelper()
const parallelHelper = new ParallelServiceHelper()
const knowledgeAreaHelper = new KnowledgeAreaServiceHelper()
const subjectHelper = new SubjectServiceHelper()
const trimesterHelper = new TrimesterPeriodServiceHelper()

// ---- Levels ----
export class LevelService {
  static async list(q: PageQuery): Promise<PagedResponse<Level>> {
    const { call } = levelHelper.listAsync(q)
    return (await call).data
  }
  static async create(payload: { name: string }): Promise<Level> {
    const { call } = levelHelper.createAsync(payload)
    return (await call).data
  }
  static async update(id: number, payload: { name: string }): Promise<Level> {
    const { call } = levelHelper.updateAsync(id, payload)
    return (await call).data
  }
  static async remove(id: number): Promise<void> {
    await levelHelper.removeAsync(id).call
  }
}

// ---- Grades ----
export class GradeAdminService {
  static async list(q: PageQuery): Promise<PagedResponse<Grade>> {
    const { call } = gradeHelper.listAsync(q)
    return (await call).data
  }
  static async create(payload: {
    name: string
    id_level: number
  }): Promise<Grade> {
    const { call } = gradeHelper.createAsync(payload)
    return (await call).data
  }
  static async update(
    id: number,
    payload: { name: string; id_level: number }
  ): Promise<Grade> {
    const { call } = gradeHelper.updateAsync(id, payload)
    return (await call).data
  }
  static async remove(id: number): Promise<void> {
    await gradeHelper.removeAsync(id).call
  }
}

// ---- Parallels ----
export class ParallelService {
  static async list(q: PageQuery): Promise<PagedResponse<Parallel>> {
    const { call } = parallelHelper.listAsync(q)
    return (await call).data
  }
  static async create(payload: { name: string }): Promise<Parallel> {
    const { call } = parallelHelper.createAsync(payload)
    return (await call).data
  }
  static async update(
    id: number,
    payload: { name: string }
  ): Promise<Parallel> {
    const { call } = parallelHelper.updateAsync(id, payload)
    return (await call).data
  }
  static async remove(id: number): Promise<void> {
    await parallelHelper.removeAsync(id).call
  }
}

// ---- Knowledge areas ----
export class KnowledgeAreaAdminService {
  static async list(q: PageQuery): Promise<PagedResponse<KnowledgeArea>> {
    const { call } = knowledgeAreaHelper.listAsync(q)
    return (await call).data
  }
  static async create(payload: {
    name: string
    displayOrder?: number
  }): Promise<KnowledgeArea> {
    const { call } = knowledgeAreaHelper.createAsync(payload)
    return (await call).data
  }
  static async update(
    id: number,
    payload: { name: string; displayOrder?: number }
  ): Promise<KnowledgeArea> {
    const { call } = knowledgeAreaHelper.updateAsync(id, payload)
    return (await call).data
  }
  static async remove(id: number): Promise<void> {
    await knowledgeAreaHelper.removeAsync(id).call
  }
}

// ---- Subjects ----
export class SubjectAdminService {
  static async list(q: PageQuery): Promise<PagedResponse<Subject>> {
    const { call } = subjectHelper.listAsync(q)
    return (await call).data
  }
  static async create(payload: {
    name: string
    id_area: number
    technical: boolean
  }): Promise<Subject> {
    const { call } = subjectHelper.createAsync(payload)
    return (await call).data
  }
  static async update(
    id: string,
    payload: {
      name?: string
      id_area?: number
      technical?: boolean
      active?: boolean
    }
  ): Promise<Subject> {
    const { call } = subjectHelper.updateAsync(id, payload)
    return (await call).data
  }
  static async remove(id: string): Promise<void> {
    await subjectHelper.removeAsync(id).call
  }
}

// ---- Trimester periods ----
export class TrimesterPeriodService {
  static async list(academicYearId: number): Promise<TrimesterPeriod[]> {
    return (await trimesterHelper.listAsync(academicYearId).call).data
  }
  static async create(
    payload: CreateTrimesterPeriodPayload
  ): Promise<TrimesterPeriod> {
    return (await trimesterHelper.createAsync(payload).call).data
  }
  static async update(
    id: string,
    payload: UpdateTrimesterPeriodPayload
  ): Promise<TrimesterPeriod> {
    return (await trimesterHelper.updateAsync(id, payload).call).data
  }
  static async remove(id: string): Promise<void> {
    await trimesterHelper.removeAsync(id).call
  }
}
