import { isRole } from "@/features/auth/types"
import type { NotificationItem } from "../types"

/** Every screen a notice can open. The inbox is where one with nowhere better to go is read. */
export type NotificationTarget =
  | "/pdc"
  | "/students"
  | "/estudiantes"
  | "/riesgo"
  | "/attendance"
  | "/scores"
  | "/notifications"

/** Who is opening it: the same notice points at different screens for different roles. */
export interface NotificationViewer {
  role: string | null
  /** A technical teacher has no homeroom, so the homeroom roster has nothing to show them. */
  isTechnical: boolean | null
}

const INBOX: NotificationTarget = "/notifications"

/**
 * What the model writes when a student falls into risk: a CUSTOM notice about a class group. It has
 * no type of its own, so the resource is the only thing that tells it apart from a typed note.
 */
const RISK_RESOURCE = "class_group"

/**
 * The screen a notice is about, for the person reading it.
 *
 * <p>Every branch checks the role the route's `beforeLoad` admits. A route that refuses redirects
 * to the dashboard, and a click that lands somewhere unrelated reads as a broken link — so a role
 * the screen does not take stays on the inbox, where the notice is at least on screen.
 *
 * <p>The PDC screen takes no plan in its URL yet, so a plan notice opens the list, not the plan.
 */
export function targetOf(
  n: NotificationItem,
  viewer: NotificationViewer
): NotificationTarget {
  const { role } = viewer
  const teacher = isRole(role, "TEACHER")
  const director = isRole(role, "DIRECTOR")
  const secretary = isRole(role, "SECRETARY")

  switch (n.type) {
    case "PDC_PUBLISHED":
    case "PDC_APPROVED":
    case "PDC_OBSERVED":
    case "PDC_PROGRESS":
      return teacher || director ? "/pdc" : INBOX
    case "STUDENT_WITHDRAWN":
    case "STUDENT_REINSTATED":
      if (director || secretary) return "/estudiantes"
      return teacher && !viewer.isTechnical ? "/students" : INBOX
    case "ATTENDANCE":
      return teacher ? "/attendance" : INBOX
    case "NOTEBOOK":
      return teacher ? "/scores" : INBOX
    case "CUSTOM":
      return n.resourceType === RISK_RESOURCE &&
        (teacher || director || secretary)
        ? "/riesgo"
        : INBOX
    case "SUMMONS":
      return INBOX
  }
}
