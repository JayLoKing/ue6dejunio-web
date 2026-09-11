/**
 * The risk routes this panel reads.
 *
 * Each one is guarded by ownership on the API side rather than by role, so the reachable set
 * differs per caller: a teacher gets the subjects they teach and the roster of a course they
 * appear in, the Director gets the sweep. Asking for one outside that is a 403, not an empty list.
 *
 * The API also answers `GET /students/{id}/risk`, one student across every subject they sit. It
 * is deliberately not here: nothing reads it yet, and a path with no caller is a claim that
 * something works which nobody has ever run.
 */
export const RiskUrl = {
  /** The sweep over the whole gestión. Director only. */
  PredictYear: "/risk/predict-year",
  PredictClassGroup: (classGroupId: string) =>
    `/class-groups/${classGroupId}/risk/predict`,
  ByClassGroup: (classGroupId: string) => `/class-groups/${classGroupId}/risk`,
  ByCourse: (courseId: string) => `/courses/${courseId}/risk`,
  Attend: (id: string) => `/risk-predictions/${id}/attend`,
} as const
