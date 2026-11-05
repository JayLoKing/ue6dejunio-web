import { describe, expect, it } from "vitest"

import { targetOf } from "./target"
import type { NotificationItem, NotificationType } from "../types"

const notice = (
  type: NotificationType,
  over: Partial<NotificationItem> = {}
): NotificationItem => ({
  id: "n-1",
  senderId: null,
  senderName: null,
  receiverId: "u-1",
  receiverName: "Ana Pérez",
  type,
  subject: null,
  message: "…",
  resourceType: null,
  resourceId: null,
  deliveredAt: null,
  readAt: null,
  read: false,
  createdAt: "2026-11-05T10:00:00Z",
  ...over,
})

const teacher = { role: "TEACHER", isTechnical: false }
const technical = { role: "TEACHER", isTechnical: true }
const director = { role: "DIRECTOR", isTechnical: false }
const secretary = { role: "SECRETARY", isTechnical: false }

describe("targetOf", () => {
  it("sends every plan notice to the PDC screen", () => {
    expect(targetOf(notice("PDC_PUBLISHED"), director)).toBe("/pdc")
    expect(targetOf(notice("PDC_APPROVED"), teacher)).toBe("/pdc")
    expect(targetOf(notice("PDC_OBSERVED"), teacher)).toBe("/pdc")
    expect(targetOf(notice("PDC_PROGRESS"), teacher)).toBe("/pdc")
  })

  it("keeps a plan notice on the inbox for a role the PDC screen refuses", () => {
    expect(targetOf(notice("PDC_PROGRESS"), secretary)).toBe("/notifications")
  })

  it("opens the homeroom roster for a withdrawal or a reinstatement", () => {
    expect(targetOf(notice("STUDENT_WITHDRAWN"), teacher)).toBe("/students")
    expect(targetOf(notice("STUDENT_REINSTATED"), teacher)).toBe("/students")
  })

  it("opens the school-wide directory for staff who have no homeroom", () => {
    expect(targetOf(notice("STUDENT_WITHDRAWN"), director)).toBe("/estudiantes")
    expect(targetOf(notice("STUDENT_WITHDRAWN"), secretary)).toBe(
      "/estudiantes"
    )
  })

  it("does not send a technical teacher to a roster that presumes a homeroom", () => {
    expect(targetOf(notice("STUDENT_WITHDRAWN"), technical)).toBe(
      "/notifications"
    )
  })

  it("opens the risk panel for the model's warning about a class group", () => {
    const risk = notice("CUSTOM", {
      subject: "Riesgo académico en Matemática",
      resourceType: "class_group",
      resourceId: "cg-1",
    })
    expect(targetOf(risk, teacher)).toBe("/riesgo")
  })

  it("opens attendance and the gradebook for a teacher only", () => {
    expect(targetOf(notice("ATTENDANCE"), teacher)).toBe("/attendance")
    expect(targetOf(notice("NOTEBOOK"), teacher)).toBe("/scores")
    expect(targetOf(notice("ATTENDANCE"), secretary)).toBe("/notifications")
    expect(targetOf(notice("NOTEBOOK"), director)).toBe("/notifications")
  })

  it("leaves a notice with no screen of its own on the inbox", () => {
    expect(targetOf(notice("SUMMONS"), teacher)).toBe("/notifications")
    expect(targetOf(notice("CUSTOM", { subject: "Reunión" }), teacher)).toBe(
      "/notifications"
    )
  })

  it("sends nobody anywhere while the session has no role", () => {
    expect(
      targetOf(notice("PDC_APPROVED"), { role: null, isTechnical: false })
    ).toBe("/notifications")
  })
})
