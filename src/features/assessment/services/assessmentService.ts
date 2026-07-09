import CriterionHelper, {
  AssessmentEventHelper,
  AssessmentScoreHelper,
} from "../helpers/assessmentServiceHelper"
import type {
  AssessmentEvent,
  AssessmentScore,
  CreateCriterionPayload,
  CreateEventPayload,
  Criterion,
  Dimension,
  SetScorePayload,
  UpdateCriterionPayload,
  UpdateEventPayload,
} from "../types"

const criterionHelper = new CriterionHelper()
const eventHelper = new AssessmentEventHelper()
const scoreHelper = new AssessmentScoreHelper()

export class CriterionService {
  static async list(
    classGroupId: string,
    trimester: number,
    dimension?: Dimension,
  ): Promise<Criterion[]> {
    return (await criterionHelper.listAsync(classGroupId, trimester, dimension).call).data
  }
  static async create(payload: CreateCriterionPayload): Promise<Criterion> {
    return (await criterionHelper.createAsync(payload).call).data
  }
  static async update(
    id: string,
    payload: UpdateCriterionPayload,
  ): Promise<Criterion> {
    return (await criterionHelper.updateAsync(id, payload).call).data
  }
  static async remove(id: string): Promise<void> {
    await criterionHelper.deleteAsync(id).call
  }
}

export class AssessmentEventService {
  static async list(criterionId: string): Promise<AssessmentEvent[]> {
    return (await eventHelper.listAsync(criterionId).call).data
  }
  static async create(payload: CreateEventPayload): Promise<AssessmentEvent> {
    return (await eventHelper.createAsync(payload).call).data
  }
  static async update(
    id: string,
    payload: UpdateEventPayload,
  ): Promise<AssessmentEvent> {
    return (await eventHelper.updateAsync(id, payload).call).data
  }
  static async remove(id: string): Promise<void> {
    await eventHelper.deleteAsync(id).call
  }
}

export class AssessmentScoreService {
  static async setScore(payload: SetScorePayload): Promise<AssessmentScore> {
    return (await scoreHelper.setScoreAsync(payload).call).data
  }
  static async byEvent(eventId: string): Promise<AssessmentScore[]> {
    return (await scoreHelper.byEventAsync(eventId).call).data
  }
  static async byCourseEnrollment(
    courseEnrollmentId: string,
  ): Promise<AssessmentScore[]> {
    return (await scoreHelper.byCourseEnrollmentAsync(courseEnrollmentId).call)
      .data
  }
  static async remove(id: string): Promise<void> {
    await scoreHelper.deleteAsync(id).call
  }
}
