import type { UseApiCall } from "@/lib/useApicall"
import { loadAbort } from "@/lib/loadAbort"
import { httpClient } from "@/lib/axios"
import type { PagedResponse, PageQuery } from "@/lib/types/pagination"
import { toPageParams } from "@/lib/types/pagination"

import { TeacherStudentsUrl } from "./teacherStudentsPath"
import type { StudentResponse } from "../models/response/student-response"

export default class TeacherStudentsHelper {
  byTeacherAsync(
    userId: string,
    query: PageQuery,
  ): UseApiCall<PagedResponse<StudentResponse>> {
    const controller = loadAbort()
    return {
      call: httpClient.get<PagedResponse<StudentResponse>>(
        TeacherStudentsUrl.ByTeacher(userId),
        { signal: controller.signal, params: toPageParams(query) },
      ),
      controller,
    }
  }
}
