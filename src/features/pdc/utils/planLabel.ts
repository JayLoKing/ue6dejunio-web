import type { Pdc } from "../types"

/**
 * How a plan is named on screen. The plan carries no title of its own — the paper form heads
 * itself with its number and the course it belongs to, so that is what identifies it here too.
 */
export function planLabel(plan: Pick<Pdc, "planNumber" | "courseName">): string {
  const course = plan.courseName?.trim()
  return course
    ? `Plan Nº ${plan.planNumber} · ${course}`
    : `Plan Nº ${plan.planNumber}`
}

/** The subjects a plan covers, for a listing row that shows no blocks of its own. */
export function subjectSummary(plan: Pick<Pdc, "subjects">): string {
  if (plan.subjects.length === 0) return "—"
  if (plan.subjects.length <= 2) {
    return plan.subjects.map((s) => s.subjectName).join(", ")
  }
  return `${plan.subjects.length} materias`
}
