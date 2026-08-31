import { describe, expect, it } from "vitest"

import { headingOf } from "./heading"
import type { NotificationItem } from "../types"

const notification = (over: Partial<NotificationItem> = {}): NotificationItem =>
  ({
    id: "n-1",
    senderId: null,
    senderName: null,
    receiverId: "u-1",
    receiverName: "Ana Pérez",
    type: "SUMMONS",
    subject: null,
    message: "Aproxímese a dirección.",
    resourceType: null,
    resourceId: null,
    deliveredAt: null,
    readAt: null,
    read: false,
    createdAt: "2026-08-30T10:00:00",
    ...over,
  }) as NotificationItem

describe("headingOf", () => {
  // The catalog types are their own subject, which is why the API refuses to store a second one
  // beside them. The words live here, once.
  it("names the catalog type in the reader's language", () => {
    expect(headingOf(notification({ type: "SUMMONS" }))).toBe(
      "Citación a dirección"
    )
    expect(headingOf(notification({ type: "NOTEBOOK" }))).toBe(
      "Cuaderno pedagógico"
    )
    expect(headingOf(notification({ type: "PDC_OBSERVED" }))).toBe(
      "PDC observado"
    )
  })

  it("uses the subject the Director typed on a custom one", () => {
    expect(
      headingOf(notification({ type: "CUSTOM", subject: "Reunión de padres" }))
    ).toBe("Reunión de padres")
  })

  // The API will not store a CUSTOM without a subject, but a row written before that rule existed
  // still has to render as something rather than as an empty line.
  it("falls back to a plain word when a custom one has no subject", () => {
    expect(headingOf(notification({ type: "CUSTOM", subject: null }))).toBe(
      "Aviso"
    )
    expect(headingOf(notification({ type: "CUSTOM", subject: "   " }))).toBe(
      "Aviso"
    )
  })

  // A type this build does not know is a server that moved ahead of the browser. It reads as a
  // notice rather than as a blank or a raw enum name.
  it("does not print a raw type name for something it does not know", () => {
    expect(
      headingOf(notification({ type: "WHATEVER" as NotificationItem["type"] }))
    ).toBe("Aviso")
  })
})
