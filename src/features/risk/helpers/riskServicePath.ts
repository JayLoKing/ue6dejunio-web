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
  /**
   * The students of the whole school closest to failing, one row each. Director only, and gated on
   * role alone: the answer spans every course of the gestión, so there is no single course to
   * resolve ownership against.
   */
  Institution: "/risk/institution",
  PredictClassGroup: (classGroupId: string) =>
    `/class-groups/${classGroupId}/risk/predict`,
  ByClassGroup: (classGroupId: string) => `/class-groups/${classGroupId}/risk`,
  ByCourse: (courseId: string) => `/courses/${courseId}/risk`,
  Attend: (id: string) => `/risk-predictions/${id}/attend`,
} as const
