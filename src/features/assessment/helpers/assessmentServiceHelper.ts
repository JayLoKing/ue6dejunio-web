import type { UseApiCall } from "@/lib/useApicall"
import { loadAbort } from "@/lib/loadAbort"
import { httpClient } from "@/lib/axios"

import {
  AssessmentEventUrl,
  AssessmentScoreUrl,
  CriterionUrl,
} from "./assessmentServicePath"
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

// ---- Criteria ----
export default class CriterionHelper {
  listAsync(
    classGroupId: string,
    trimester: number,
    dimension?: Dimension,
  ): UseApiCall<Criterion[]> {
    const controller = loadAbort()
    return {
      call: httpClient.get<Criterion[]>(CriterionUrl.Base, {
        signal: controller.signal,
        params: { id_class_group: classGroupId, trimester, dimension },
      }),
      controller,
    }
  }
  createAsync(payload: CreateCriterionPayload): UseApiCall<Criterion> {
    const controller = loadAbort()
    return {
      call: httpClient.post<Criterion>(CriterionUrl.Base, payload, {
        signal: controller.signal,
      }),
      controller,
    }
  }
  updateAsync(
    id: string,
    payload: UpdateCriterionPayload,
  ): UseApiCall<Criterion> {
    const controller = loadAbort()
    return {
      call: httpClient.put<Criterion>(CriterionUrl.ById(id), payload, {
        signal: controller.signal,
      }),
      controller,
    }
  }
  deleteAsync(id: string): UseApiCall<void> {
    const controller = loadAbort()
    return {
      call: httpClient.delete<void>(CriterionUrl.ById(id), {
        signal: controller.signal,
      }),
      controller,
    }
  }
}

// ---- Events (activities) ----
export class AssessmentEventHelper {
  listAsync(criterionId: string): UseApiCall<AssessmentEvent[]> {
    const controller = loadAbort()
    return {
      call: httpClient.get<AssessmentEvent[]>(AssessmentEventUrl.Base, {
        signal: controller.signal,
        params: { id_criterion: criterionId },
      }),
      controller,
    }
  }
  createAsync(payload: CreateEventPayload): UseApiCall<AssessmentEvent> {
    const controller = loadAbort()
    return {
      call: httpClient.post<AssessmentEvent>(AssessmentEventUrl.Base, payload, {
        signal: controller.signal,
      }),
      controller,
    }
  }
  updateAsync(
    id: string,
    payload: UpdateEventPayload,
  ): UseApiCall<AssessmentEvent> {
    const controller = loadAbort()
    return {
      call: httpClient.put<AssessmentEvent>(
        AssessmentEventUrl.ById(id),
        payload,
        { signal: controller.signal },
      ),
      controller,
    }
  }
  deleteAsync(id: string): UseApiCall<void> {
    const controller = loadAbort()
    return {
      call: httpClient.delete<void>(AssessmentEventUrl.ById(id), {
        signal: controller.signal,
      }),
      controller,
    }
  }
}

// ---- Scores (by course_enrollment) ----
export class AssessmentScoreHelper {
  setScoreAsync(payload: SetScorePayload): UseApiCall<AssessmentScore> {
    const controller = loadAbort()
    return {
      call: httpClient.post<AssessmentScore>(AssessmentScoreUrl.Base, payload, {
        signal: controller.signal,
      }),
      controller,
    }
  }
  byEventAsync(eventId: string): UseApiCall<AssessmentScore[]> {
    const controller = loadAbort()
    return {
      call: httpClient.get<AssessmentScore[]>(
        AssessmentScoreUrl.ByEvent(eventId),
        { signal: controller.signal },
      ),
      controller,
    }
  }
  byCriterionAsync(criterionId: string): UseApiCall<AssessmentScore[]> {
    const controller = loadAbort()
    return {
      call: httpClient.get<AssessmentScore[]>(
        AssessmentScoreUrl.ByCriterion(criterionId),
        { signal: controller.signal },
      ),
      controller,
    }
  }
  byCourseEnrollmentAsync(
    courseEnrollmentId: string,
  ): UseApiCall<AssessmentScore[]> {
    const controller = loadAbort()
    return {
      call: httpClient.get<AssessmentScore[]>(AssessmentScoreUrl.Base, {
        signal: controller.signal,
        params: { id_course_enrollment: courseEnrollmentId },
      }),
      controller,
    }
  }
  deleteAsync(id: string): UseApiCall<void> {
    const controller = loadAbort()
    return {
      call: httpClient.delete<void>(AssessmentScoreUrl.ById(id), {
        signal: controller.signal,
      }),
      controller,
    }
  }
}
