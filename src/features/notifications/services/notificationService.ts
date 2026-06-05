import type { PagedResponse } from "@/lib/types/pagination"

import NotificationServiceHelper, {
  type InboxParams,
  type SendNotificationPayload,
} from "../helpers/notificationServiceHelper"
import type { NotificationItem } from "../types"

export type { InboxParams, SendNotificationPayload }

const helper = new NotificationServiceHelper()

export class NotificationService {
  static async inbox(
    params: InboxParams = {},
  ): Promise<PagedResponse<NotificationItem>> {
    const { call } = helper.inboxAsync(params)
    return (await call).data
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
    payload: SendNotificationPayload,
  ): Promise<NotificationItem> {
    const { call } = helper.sendAsync(payload)
    return (await call).data
  }
}
