import type { PagedResponse, PageQuery } from "@/lib/types/pagination"

import StudentDirectoryHelper from "../helpers/studentDirectoryHelper"
import type { StudentDirectoryResponse } from "../models/response/student-directory-response"
import type { StudentDirectoryFilters } from "../types"

const helper = new StudentDirectoryHelper()

export class StudentDirectoryService {
  static async search(
    filters: StudentDirectoryFilters,
    query: PageQuery
  ): Promise<PagedResponse<StudentDirectoryResponse>> {
    return (await helper.searchAsync(filters, query).call).data
  }
}
