import type { PagedResponse, PageQuery } from "@/lib/types/pagination"

import LevelServiceHelper, {
  GradeServiceHelper,
  ParallelServiceHelper,
  SubjectServiceHelper,
} from "../helpers/academicServiceHelper"
import type { Grade, Level, Parallel, Subject } from "../types"

const levelHelper = new LevelServiceHelper()
const gradeHelper = new GradeServiceHelper()
const parallelHelper = new ParallelServiceHelper()
const subjectHelper = new SubjectServiceHelper()

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
    payload: { name: string; id_level: number },
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
    payload: { name: string },
  ): Promise<Parallel> {
    const { call } = parallelHelper.updateAsync(id, payload)
    return (await call).data
  }
  static async remove(id: number): Promise<void> {
    await parallelHelper.removeAsync(id).call
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
    technical: boolean
  }): Promise<Subject> {
    const { call } = subjectHelper.createAsync(payload)
    return (await call).data
  }
  static async update(
    id: string,
    payload: { name?: string; technical?: boolean; active?: boolean },
  ): Promise<Subject> {
    const { call } = subjectHelper.updateAsync(id, payload)
    return (await call).data
  }
  static async remove(id: string): Promise<void> {
    await subjectHelper.removeAsync(id).call
  }
}
