import type { AcademicYearItem } from "@/features/catalog/types"

import AcademicYearServiceHelper from "../helpers/academicYearServiceHelper"
import type { CreatedAcademicYear, DuplicateStructureSummary } from "../types"

const helper = new AcademicYearServiceHelper()

/** The Director-only operations on a year. Listing lives in the catalog feature. */
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

  /** The API answers 201 for a new year and 200 for one that was already there. */
  static async create(year: number): Promise<CreatedAcademicYear> {
    const response = await helper.createAsync(year).call
    return { year: response.data, created: response.status === 201 }
  }

  static async duplicateStructure(
    targetId: number,
    sourceId: number
  ): Promise<DuplicateStructureSummary> {
    return (await helper.duplicateStructureAsync(targetId, sourceId).call).data
  }
}
