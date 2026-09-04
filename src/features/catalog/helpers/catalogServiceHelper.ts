import type { UseApiCall } from "@/lib/useApicall"
import { loadAbort } from "@/lib/loadAbort"
import { httpClient } from "@/lib/axios"

import { CatalogUrl } from "./catalogServicePath"
import type {
  AcademicYearItem,
  GradeItem,
  ParallelItem,
  SubjectItem,
  TeacherItem,
  TrimesterItem,
} from "../types"

export default class CatalogServiceHelper {
  gradesAsync(): UseApiCall<GradeItem[]> {
    const controller = loadAbort()
    return {
      call: httpClient.get<GradeItem[]>(CatalogUrl.Grades, {
        signal: controller.signal,
      }),
      controller,
    }
  }
  parallelsAsync(): UseApiCall<ParallelItem[]> {
    const controller = loadAbort()
    return {
      call: httpClient.get<ParallelItem[]>(CatalogUrl.Parallels, {
        signal: controller.signal,
      }),
      controller,
    }
  }
  subjectsAsync(): UseApiCall<SubjectItem[]> {
    const controller = loadAbort()
    return {
      call: httpClient.get<SubjectItem[]>(CatalogUrl.Subjects, {
        signal: controller.signal,
      }),
      controller,
    }
  }
  trimestersAsync(academicYearId?: number): UseApiCall<TrimesterItem[]> {
    const controller = loadAbort()
    return {
      call: httpClient.get<TrimesterItem[]>(CatalogUrl.Trimesters, {
        signal: controller.signal,
        params:
          academicYearId === undefined
            ? undefined
            : { id_academic_year: academicYearId },
      }),
      controller,
    }
  }
  academicYearsAsync(): UseApiCall<AcademicYearItem[]> {
    const controller = loadAbort()
    return {
      call: httpClient.get<AcademicYearItem[]>(CatalogUrl.AcademicYears, {
        signal: controller.signal,
      }),
      controller,
    }
  }
  teachersAsync(technical?: boolean): UseApiCall<TeacherItem[]> {
    const controller = loadAbort()
    return {
      call: httpClient.get<TeacherItem[]>(CatalogUrl.Teachers, {
        signal: controller.signal,
        params: technical === undefined ? undefined : { technical },
      }),
      controller,
    }
  }
}
