import type { UseApiCall } from "@/lib/useApicall"
import { loadAbort } from "@/lib/loadAbort"
import { httpClient } from "@/lib/axios"
import type { PagedResponse, PageQuery } from "@/lib/types/pagination"
import { toPageParams } from "@/lib/types/pagination"

import { StudentDirectoryUrl } from "./studentDirectoryPath"
import type { StudentDirectoryResponse } from "../models/response/student-directory-response"
import type { StudentDirectoryFilters } from "../types"
import { toDirectoryParams } from "../utils/directoryParams"

export default class StudentDirectoryHelper {
  searchAsync(
    filters: StudentDirectoryFilters,
    query: PageQuery
  ): UseApiCall<PagedResponse<StudentDirectoryResponse>> {
    const controller = loadAbort()
    return {
      call: httpClient.get<PagedResponse<StudentDirectoryResponse>>(
        StudentDirectoryUrl.Search,
        {
          signal: controller.signal,
          params: toPageParams(query, toDirectoryParams(filters)),
        }
      ),
      controller,
    }
  }
}
