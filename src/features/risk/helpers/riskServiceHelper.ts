import { httpClient } from "@/lib/axios"
import { loadAbort } from "@/lib/loadAbort"
import type { UseApiCall } from "@/lib/useApicall"

import { RiskUrl } from "./riskServicePath"
import type {
  InstitutionRiskEntry,
  RiskPrediction,
  RunSummary,
  StudentRisk,
} from "../types/risk"

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

  /**
   * @param academicYearId the row id of the gestión, not the calendar year. `id_academic_year` is
   *   a SERIAL, and the sweep above is the one that takes the year itself.
   */
  institutionAsync(
    academicYearId: number,
    trimester: number,
    places: number
  ): UseApiCall<InstitutionRiskEntry[]> {
    const controller = loadAbort()
    return {
      call: httpClient.get<InstitutionRiskEntry[]>(RiskUrl.Institution, {
        signal: controller.signal,
        params: { id_academic_year: academicYearId, trimester, places },
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
