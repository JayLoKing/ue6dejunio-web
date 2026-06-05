import type { UseApiCall } from "@/lib/useApicall"
import { loadAbort } from "@/lib/loadAbort"
import { httpClient } from "@/lib/axios"

import { CatalogUrl } from "./catalogServicePath"
import type { GradeItem, ParallelItem, SubjectItem, TeacherItem } from "../types"

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
  teachersAsync(): UseApiCall<TeacherItem[]> {
    const controller = loadAbort()
    return {
      call: httpClient.get<TeacherItem[]>(CatalogUrl.Teachers, {
        signal: controller.signal,
      }),
      controller,
    }
  }
}
