import type { AcademicYearItem } from "@/features/catalog/types"

import AcademicYearServiceHelper from "../helpers/academicYearServiceHelper"

const helper = new AcademicYearServiceHelper()

/** The three Director-only transitions of a year. Listing lives in the catalog feature. */
export class AcademicYearService {
  static async activate(id: number): Promise<AcademicYearItem> {
    return (await helper.activateAsync(id).call).data
  }

  static async close(id: number): Promise<AcademicYearItem> {
    return (await helper.closeAsync(id).call).data
  }

  static async reopen(id: number): Promise<AcademicYearItem> {
    return (await helper.reopenAsync(id).call).data
  }
}
