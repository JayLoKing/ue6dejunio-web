import CatalogServiceHelper from "../helpers/catalogServiceHelper"
import type { GradeItem, ParallelItem, SubjectItem, TeacherItem } from "../types"

const helper = new CatalogServiceHelper()

export class CatalogService {
  static async grades(): Promise<GradeItem[]> {
    return (await helper.gradesAsync().call).data
  }
  static async parallels(): Promise<ParallelItem[]> {
    return (await helper.parallelsAsync().call).data
  }
  static async subjects(): Promise<SubjectItem[]> {
    return (await helper.subjectsAsync().call).data
  }
  static async teachers(technical?: boolean): Promise<TeacherItem[]> {
    return (await helper.teachersAsync(technical).call).data
  }
}
