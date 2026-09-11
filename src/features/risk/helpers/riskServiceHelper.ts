import { httpClient } from "@/lib/axios"
import { loadAbort } from "@/lib/loadAbort"
import type { UseApiCall } from "@/lib/useApicall"

import { RiskUrl } from "./riskServicePath"
import type { RiskPrediction, RunSummary, StudentRisk } from "../types/risk"

export default class RiskServiceHelper {
  predictYearAsync(
    academicYear: number,
    trimester: number
  ): UseApiCall<RunSummary> {
    const controller = loadAbort()
    return {
      call: httpClient.post<RunSummary>(RiskUrl.PredictYear, null, {
        signal: controller.signal,
        params: { academicYear, trimester },
      }),
      controller,
    }
  }

  predictClassGroupAsync(
    classGroupId: string,
    trimester: number
  ): UseApiCall<RunSummary> {
    const controller = loadAbort()
    return {
      call: httpClient.post<RunSummary>(
        RiskUrl.PredictClassGroup(classGroupId),
        null,
        { signal: controller.signal, params: { trimester } }
      ),
      controller,
    }
  }

  byClassGroupAsync(
    classGroupId: string,
    trimester: number
  ): UseApiCall<StudentRisk[]> {
    const controller = loadAbort()
    return {
      call: httpClient.get<StudentRisk[]>(RiskUrl.ByClassGroup(classGroupId), {
        signal: controller.signal,
        params: { trimester },
      }),
      controller,
    }
  }

  byCourseAsync(
    courseId: string,
    trimester: number
  ): UseApiCall<StudentRisk[]> {
    const controller = loadAbort()
    return {
      call: httpClient.get<StudentRisk[]>(RiskUrl.ByCourse(courseId), {
        signal: controller.signal,
        params: { trimester },
      }),
      controller,
    }
  }

  attendAsync(id: string, attended: boolean): UseApiCall<RiskPrediction> {
    const controller = loadAbort()
    return {
      call: httpClient.put<RiskPrediction>(RiskUrl.Attend(id), null, {
        signal: controller.signal,
        params: { attended },
      }),
      controller,
    }
  }
}
