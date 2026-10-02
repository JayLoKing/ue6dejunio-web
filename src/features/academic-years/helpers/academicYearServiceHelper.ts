import type { UseApiCall } from "@/lib/useApicall"
import { loadAbort } from "@/lib/loadAbort"
import { httpClient } from "@/lib/axios"
import type { AcademicYearItem } from "@/features/catalog/types"

import type { DuplicateStructureSummary } from "../types"
import { AcademicYearUrl } from "./academicYearServicePath"

export default class AcademicYearServiceHelper {
  activateAsync(id: number): UseApiCall<AcademicYearItem> {
    return this.put(AcademicYearUrl.Activate(id))
  }

  closeAsync(id: number): UseApiCall<AcademicYearItem> {
    return this.put(AcademicYearUrl.Close(id))
  }

  reopenAsync(id: number): UseApiCall<AcademicYearItem> {
    return this.put(AcademicYearUrl.Reopen(id))
  }

  /** 201 when the year is new, 200 when it already existed: the caller reads the status. */
  createAsync(year: number): UseApiCall<AcademicYearItem> {
    const controller = loadAbort()
    return {
      call: httpClient.post<AcademicYearItem>(
        AcademicYearUrl.Base,
        { year },
        { signal: controller.signal }
      ),
      controller,
    }
  }

  duplicateStructureAsync(
    targetId: number,
    sourceId: number
  ): UseApiCall<DuplicateStructureSummary> {
    const controller = loadAbort()
    return {
      call: httpClient.post<DuplicateStructureSummary>(
        AcademicYearUrl.DuplicateStructure(targetId),
        { source_academic_year_id: sourceId },
        { signal: controller.signal }
      ),
      controller,
    }
  }

  private put(url: string): UseApiCall<AcademicYearItem> {
    const controller = loadAbort()
    return {
      call: httpClient.put<AcademicYearItem>(url, undefined, {
        signal: controller.signal,
      }),
      controller,
    }
  }
}
