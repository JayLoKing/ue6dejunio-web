import CatalogServiceHelper from "../helpers/catalogServiceHelper"
import type {
  AcademicYearItem,
  GradeItem,
  ParallelItem,
  SubjectItem,
  TeacherItem,
  TrimesterItem,
} from "../types"

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
  static async academicYears(): Promise<AcademicYearItem[]> {
    return (await helper.academicYearsAsync().call).data
  }
  static async teachers(technical?: boolean): Promise<TeacherItem[]> {
    return (await helper.teachersAsync(technical).call).data
  }
  static async trimesters(academicYearId?: number): Promise<TrimesterItem[]> {
    return (await helper.trimestersAsync(academicYearId).call).data
  }
}
