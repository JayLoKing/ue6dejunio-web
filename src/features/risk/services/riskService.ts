import RiskServiceHelper from "../helpers/riskServiceHelper"
import type {
  InstitutionRiskEntry,
  RiskPrediction,
  RunSummary,
  StudentRisk,
} from "../types/risk"

const helper = new RiskServiceHelper()

export class RiskService {
  static async predictYear(
    academicYear: number,
    trimester: number
  ): Promise<RunSummary> {
    return (await helper.predictYearAsync(academicYear, trimester).call).data
  }

  static async predictClassGroup(
    classGroupId: string,
    trimester: number
  ): Promise<RunSummary> {
    return (await helper.predictClassGroupAsync(classGroupId, trimester).call)
      .data
  }

  static async byClassGroup(
    classGroupId: string,
    trimester: number
  ): Promise<StudentRisk[]> {
    return (await helper.byClassGroupAsync(classGroupId, trimester).call).data
  }

  static async byCourse(
    courseId: string,
    trimester: number
  ): Promise<StudentRisk[]> {
    return (await helper.byCourseAsync(courseId, trimester).call).data
  }

  static async institution(
    academicYearId: number,
    trimester: number,
    places: number
  ): Promise<InstitutionRiskEntry[]> {
    return (
      await helper.institutionAsync(academicYearId, trimester, places).call
    ).data
  }

  static async markAttended(
    id: string,
    attended: boolean
  ): Promise<RiskPrediction> {
    return (await helper.attendAsync(id, attended).call).data
  }
}
