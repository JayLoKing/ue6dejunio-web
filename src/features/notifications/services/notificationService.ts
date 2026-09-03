import type { PagedResponse } from "@/lib/types/pagination"

import NotificationServiceHelper, {
  type InboxParams,
  type SendNotificationPayload,
} from "../helpers/notificationServiceHelper"
import type { NotificationItem } from "../types"

export type { InboxParams, SendNotificationPayload }

const helper = new NotificationServiceHelper()

/**
 * The server would not open the stream, and said with what status.
 *
 * <p>The status is carried rather than swallowed because the caller's answer depends on it: a 401
 * is a session that is over and must not be retried, and anything else is worth trying again.
 */
export class StreamRefusedError extends Error {
  // Declared rather than a constructor parameter property: the build runs with
  // `erasableSyntaxOnly`, which refuses the shorthand because it emits code rather than erasing.
  readonly status: number

  constructor(status: number) {
    super(`El servidor rechazó el stream de notificaciones: ${status}`)
    this.name = "StreamRefusedError"
    this.status = status
  }
}

export class NotificationService {
  static async inbox(
    params: InboxParams = {}
  ): Promise<PagedResponse<NotificationItem>> {
    const { call } = helper.inboxAsync(params)
    return (await call).data
  }

  /**
   * The live stream, as something to read from.
   *
   * @throws StreamRefusedError when the server would not open it, carrying the status so the
   *         caller can tell a session that is over from a server that is merely down.
   */
  static async stream(
    token: string,
    signal: AbortSignal
  ): Promise<ReadableStreamDefaultReader<Uint8Array>> {
    const response = await helper.streamAsync(token, signal)
    if (!response.ok || !response.body) {
      throw new StreamRefusedError(response.status)
    }
    return response.body.getReader()
  }

  static async unreadCount(): Promise<number> {
    const { call } = helper.unreadCountAsync()
    return (await call).data.unread
  }

  static async markRead(id: string): Promise<NotificationItem> {
    const { call } = helper.markReadAsync(id)
    return (await call).data
  }

  static async markAllRead(): Promise<void> {
    await helper.markAllReadAsync().call
  }

  static async remove(id: string): Promise<void> {
    await helper.removeAsync(id).call
  }

  static async send(
    payload: SendNotificationPayload
  ): Promise<NotificationItem> {
    const { call } = helper.sendAsync(payload)
    return (await call).data
  }
}
