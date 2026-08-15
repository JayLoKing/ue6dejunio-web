import type { UseApiCall } from "@/lib/useApicall"
import { loadAbort } from "@/lib/loadAbort"
import { httpClient } from "@/lib/axios"
import type { PagedResponse, PageQuery } from "@/lib/types/pagination"
import { toPageParams } from "@/lib/types/pagination"

import {
  CourseEnrollmentUrl,
  CourseUrl,
  TeacherClassGroupsUrl,
} from "./courseServicePath"
import type {
  ClassGroupItem,
  Course,
  CourseOverview,
  CourseStudent,
  CourseWithSubjects,
  CreateCoursePayload,
} from "../types/course"

export default class CourseServiceHelper {
  listAsync(
    query: PageQuery,
    academicYearId?: number,
  ): UseApiCall<PagedResponse<Course>> {
    const controller = loadAbort()
    return {
      call: httpClient.get<PagedResponse<Course>>(CourseUrl.Base, {
        signal: controller.signal,
        params: toPageParams(query, { id_academic_year: academicYearId }),
      }),
      controller,
    }
  }
  overviewAsync(
    id: string,
    trimester: number,
    query: PageQuery,
  ): UseApiCall<CourseOverview> {
    const controller = loadAbort()
    return {
      call: httpClient.get<CourseOverview>(CourseUrl.Overview(id), {
        signal: controller.signal,
        params: toPageParams(query, { trimester }),
      }),
      controller,
    }
  }

  getByIdAsync(id: string): UseApiCall<Course> {
    const controller = loadAbort()
    return {
      call: httpClient.get<Course>(CourseUrl.ById(id), {
        signal: controller.signal,
      }),
      controller,
    }
  }
  createAsync(payload: CreateCoursePayload): UseApiCall<CourseWithSubjects> {
    const controller = loadAbort()
    return {
      call: httpClient.post<CourseWithSubjects>(CourseUrl.Base, payload, {
        signal: controller.signal,
      }),
      controller,
    }
  }
  setHomeroomAsync(
    id: string,
    teacherId: string,
  ): UseApiCall<Course> {
    const controller = loadAbort()
    return {
      call: httpClient.put<Course>(
        CourseUrl.Homeroom(id),
        { id_homeroom_teacher: teacherId },
        { signal: controller.signal },
      ),
      controller,
    }
  }
  deleteAsync(id: string): UseApiCall<void> {
    const controller = loadAbort()
    return {
      call: httpClient.delete<void>(CourseUrl.ById(id), {
        signal: controller.signal,
      }),
      controller,
    }
  }

  studentsAsync(
    courseId: string,
    query: PageQuery,
  ): UseApiCall<PagedResponse<CourseStudent>> {
    const controller = loadAbort()
    return {
      call: httpClient.get<PagedResponse<CourseStudent>>(
        CourseEnrollmentUrl.Base,
        {
          signal: controller.signal,
          params: toPageParams(query, { id_course: courseId }),
        },
      ),
      controller,
    }
  }

  teacherClassGroupsAsync(userId: string): UseApiCall<ClassGroupItem[]> {
    const controller = loadAbort()
    return {
      call: httpClient.get<ClassGroupItem[]>(TeacherClassGroupsUrl(userId), {
        signal: controller.signal,
      }),
      controller,
    }
  }
}
