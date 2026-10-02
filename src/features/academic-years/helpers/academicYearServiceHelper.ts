import type { UseApiCall } from "@/lib/useApicall"
import { loadAbort } from "@/lib/loadAbort"
import { httpClient } from "@/lib/axios"
import type { AcademicYearItem } from "@/features/catalog/types"

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
