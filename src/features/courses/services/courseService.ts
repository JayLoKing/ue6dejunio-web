import type { PagedResponse, PageQuery } from "@/lib/types/pagination"

import CourseServiceHelper from "../helpers/courseServiceHelper"
import type {
  ClassGroupItem,
  Course,
  CourseOverview,
  CourseStudent,
  CourseWithSubjects,
  CreateCoursePayload,
} from "../types/course"

const helper = new CourseServiceHelper()

export class CourseService {
  static async list(
    query: PageQuery,
    academicYearId?: number,
  ): Promise<PagedResponse<Course>> {
    return (await helper.listAsync(query, academicYearId).call).data
  }
  static async getById(id: string): Promise<Course> {
    return (await helper.getByIdAsync(id).call).data
  }
  static async overview(
    id: string,
    trimester: number,
    query: PageQuery,
  ): Promise<CourseOverview> {
    return (await helper.overviewAsync(id, trimester, query).call).data
  }
  static async create(
    payload: CreateCoursePayload,
  ): Promise<CourseWithSubjects> {
    return (await helper.createAsync(payload).call).data
  }
  static async setHomeroom(id: string, teacherId: string): Promise<Course> {
    return (await helper.setHomeroomAsync(id, teacherId).call).data
  }
  static async remove(id: string): Promise<void> {
    await helper.deleteAsync(id).call
  }
  static async students(
    courseId: string,
    query: PageQuery,
  ): Promise<PagedResponse<CourseStudent>> {
    return (await helper.studentsAsync(courseId, query).call).data
  }
  static async teacherClassGroups(userId: string): Promise<ClassGroupItem[]> {
    return (await helper.teacherClassGroupsAsync(userId).call).data
  }
}
