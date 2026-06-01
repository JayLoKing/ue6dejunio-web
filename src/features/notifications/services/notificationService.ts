import { httpClient } from "@/lib/axios"
import type { PagedResponse } from "@/lib/types/pagination"

import { NotificationUrl } from "../helpers/notificationPath"
import type { NotificationItem, UnreadCount } from "../types"

export interface InboxParams {
  unreadOnly?: boolean
  offset?: number
  limit?: number
}

export interface SendNotificationPayload {
  receiver_id: string
  message: string
}

export class NotificationService {
  static async inbox(
    params: InboxParams = {},
  ): Promise<PagedResponse<NotificationItem>> {
    const { data } = await httpClient.get<PagedResponse<NotificationItem>>(
      NotificationUrl.Base,
      {
        params: {
          unreadOnly: params.unreadOnly ?? false,
          offset: params.offset ?? 1,
          limit: params.limit ?? 20,
        },
      },
    )
    return data
  }

  static async unreadCount(): Promise<number> {
    const { data } = await httpClient.get<UnreadCount>(
      NotificationUrl.UnreadCount,
    )
    return data.unread
  }

  static async markRead(id: string): Promise<NotificationItem> {
    const { data } = await httpClient.post<NotificationItem>(
      NotificationUrl.Read(id),
    )
    return data
  }

  static async markAllRead(): Promise<void> {
    await httpClient.post(NotificationUrl.ReadAll)
  }

  static async remove(id: string): Promise<void> {
    await httpClient.delete(NotificationUrl.ById(id))
  }

  static async send(payload: SendNotificationPayload): Promise<NotificationItem> {
    const { data } = await httpClient.post<NotificationItem>(
      NotificationUrl.Base,
      payload,
    )
    return data
  }
}
