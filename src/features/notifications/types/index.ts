/**
 * Why the school is writing to someone. The type is the notification's subject: every one of
 * these reads as a heading on its own, which is why only CUSTOM carries a typed `subject`.
 */
export type NotificationType =
  | "PDC_PUBLISHED"
  | "PDC_APPROVED"
  | "PDC_OBSERVED"
  | "NOTEBOOK"
  | "ATTENDANCE"
  | "PDC_PROGRESS"
  | "SUMMONS"
  | "CUSTOM"

export interface NotificationItem {
  id: string
  /** Absent when the system wrote it — a state change, or later the predictive model. */
  senderId: string | null
  senderName: string | null
  receiverId: string
  receiverName: string
  type: NotificationType
  /** Only when the type is CUSTOM. */
  subject: string | null
  message: string
  /** What it is about, so the row is something the receiver can click. */
  resourceType: string | null
  resourceId: string | null
  /** When the inbox first carried it back. */
  deliveredAt: string | null
  readAt: string | null
  /** Derived from readAt by the API. The badge asks a yes-or-no question. */
  read: boolean
  createdAt: string
}

/** What the API is sent to write one. Snake case because that is the wire, not our shape. */
export interface SendNotificationPayload {
  receiver_id: string
  type: NotificationType
  /** Required by the API when the type is CUSTOM, and refused on every other type. */
  subject?: string
  message: string
  resource_type?: string
  resource_id?: string
}

export interface UnreadCount {
  unread: number
}

/**
 * Somebody the Director may write to, as the form needs them: a name to choose and an id to send.
 *
 * <p>Lives here rather than beside the form because the roster is built before any form exists —
 * a util that produced this shape would otherwise have to reach up into the components.
 */
export interface Recipient {
  id: string
  fullName: string
}
