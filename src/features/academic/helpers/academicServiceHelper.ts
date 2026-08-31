import type { UseApiCall } from "@/lib/useApicall"
import { loadAbort } from "@/lib/loadAbort"
import { httpClient } from "@/lib/axios"
import type { PagedResponse, PageQuery } from "@/lib/types/pagination"
import { toPageParams } from "@/lib/types/pagination"

import {
  GradeUrl,
  LevelUrl,
  ParallelUrl,
  SubjectUrl,
  TrimesterPeriodUrl,
} from "./academicServicePath"
import type {
  CreateTrimesterPeriodPayload,
  Grade,
  Level,
  Parallel,
  Subject,
  TrimesterPeriod,
  UpdateTrimesterPeriodPayload,
} from "../types"

// ---- Levels ----
export class LevelServiceHelper {
  listAsync(query: PageQuery): UseApiCall<PagedResponse<Level>> {
    const controller = loadAbort()
    return {
      call: httpClient.get<PagedResponse<Level>>(LevelUrl.Base, {
        signal: controller.signal,
        params: toPageParams(query),
      }),
      controller,
    }
  }
  createAsync(payload: { name: string }): UseApiCall<Level> {
    const controller = loadAbort()
    return {
      call: httpClient.post<Level>(LevelUrl.Base, payload, {
        signal: controller.signal,
      }),
      controller,
    }
  }
  updateAsync(id: number, payload: { name: string }): UseApiCall<Level> {
    const controller = loadAbort()
    return {
      call: httpClient.put<Level>(LevelUrl.ById(id), payload, {
        signal: controller.signal,
      }),
      controller,
    }
  }
  removeAsync(id: number): UseApiCall<void> {
    const controller = loadAbort()
    return {
      call: httpClient.delete<void>(LevelUrl.ById(id), {
        signal: controller.signal,
      }),
      controller,
    }
  }
}

// ---- Grades ----
export class GradeServiceHelper {
  listAsync(query: PageQuery): UseApiCall<PagedResponse<Grade>> {
    const controller = loadAbort()
    return {
      call: httpClient.get<PagedResponse<Grade>>(GradeUrl.Base, {
        signal: controller.signal,
        params: toPageParams(query),
      }),
      controller,
    }
  }
  createAsync(payload: { name: string; id_level: number }): UseApiCall<Grade> {
    const controller = loadAbort()
    return {
      call: httpClient.post<Grade>(GradeUrl.Base, payload, {
        signal: controller.signal,
      }),
      controller,
    }
  }
  updateAsync(
    id: number,
    payload: { name: string; id_level: number }
  ): UseApiCall<Grade> {
    const controller = loadAbort()
    return {
      call: httpClient.put<Grade>(GradeUrl.ById(id), payload, {
        signal: controller.signal,
      }),
      controller,
    }
  }
  removeAsync(id: number): UseApiCall<void> {
    const controller = loadAbort()
    return {
      call: httpClient.delete<void>(GradeUrl.ById(id), {
        signal: controller.signal,
      }),
      controller,
    }
  }
}

// ---- Parallels ----
export class ParallelServiceHelper {
  listAsync(query: PageQuery): UseApiCall<PagedResponse<Parallel>> {
    const controller = loadAbort()
    return {
      call: httpClient.get<PagedResponse<Parallel>>(ParallelUrl.Base, {
        signal: controller.signal,
        params: toPageParams(query),
      }),
      controller,
    }
  }
  createAsync(payload: { name: string }): UseApiCall<Parallel> {
    const controller = loadAbort()
    return {
      call: httpClient.post<Parallel>(ParallelUrl.Base, payload, {
        signal: controller.signal,
      }),
      controller,
    }
  }
  updateAsync(id: number, payload: { name: string }): UseApiCall<Parallel> {
    const controller = loadAbort()
    return {
      call: httpClient.put<Parallel>(ParallelUrl.ById(id), payload, {
        signal: controller.signal,
      }),
      controller,
    }
  }
  removeAsync(id: number): UseApiCall<void> {
    const controller = loadAbort()
    return {
      call: httpClient.delete<void>(ParallelUrl.ById(id), {
        signal: controller.signal,
      }),
      controller,
    }
  }
}

// ---- Subjects ----
export class SubjectServiceHelper {
  listAsync(query: PageQuery): UseApiCall<PagedResponse<Subject>> {
    const controller = loadAbort()
    return {
      call: httpClient.get<PagedResponse<Subject>>(SubjectUrl.Base, {
        signal: controller.signal,
        params: toPageParams(query),
      }),
      controller,
    }
  }
  createAsync(payload: {
    name: string
    technical: boolean
  }): UseApiCall<Subject> {
    const controller = loadAbort()
    return {
      call: httpClient.post<Subject>(SubjectUrl.Base, payload, {
        signal: controller.signal,
      }),
      controller,
    }
  }
  updateAsync(
    id: string,
    payload: { name?: string; technical?: boolean; active?: boolean }
  ): UseApiCall<Subject> {
    const controller = loadAbort()
    return {
      call: httpClient.put<Subject>(SubjectUrl.ById(id), payload, {
        signal: controller.signal,
      }),
      controller,
    }
  }
  removeAsync(id: string): UseApiCall<void> {
    const controller = loadAbort()
    return {
      call: httpClient.delete<void>(SubjectUrl.ById(id), {
        signal: controller.signal,
      }),
      controller,
    }
  }
}

// ---- Trimester periods ----
export class TrimesterPeriodServiceHelper {
  listAsync(academicYearId: number): UseApiCall<TrimesterPeriod[]> {
    const controller = loadAbort()
    return {
      call: httpClient.get<TrimesterPeriod[]>(TrimesterPeriodUrl.Base, {
        signal: controller.signal,
        params: { id_academic_year: academicYearId },
      }),
      controller,
    }
  }
  createAsync(
    payload: CreateTrimesterPeriodPayload
  ): UseApiCall<TrimesterPeriod> {
    const controller = loadAbort()
    return {
      call: httpClient.post<TrimesterPeriod>(TrimesterPeriodUrl.Base, payload, {
        signal: controller.signal,
      }),
      controller,
    }
  }
  updateAsync(
    id: string,
    payload: UpdateTrimesterPeriodPayload
  ): UseApiCall<TrimesterPeriod> {
    const controller = loadAbort()
    return {
      call: httpClient.put<TrimesterPeriod>(
        TrimesterPeriodUrl.ById(id),
        payload,
        { signal: controller.signal }
      ),
      controller,
    }
  }
  removeAsync(id: string): UseApiCall<void> {
    const controller = loadAbort()
    return {
      call: httpClient.delete<void>(TrimesterPeriodUrl.ById(id), {
        signal: controller.signal,
      }),
      controller,
    }
  }
}
