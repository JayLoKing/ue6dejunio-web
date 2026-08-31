import type { UseApiCall } from "@/lib/useApicall"
import { loadAbort } from "@/lib/loadAbort"
import { httpClient } from "@/lib/axios"
import type { PagedResponse } from "@/lib/types/pagination"

import { NotificationUrl } from "./notificationPath"
import type {
  NotificationItem,
  SendNotificationPayload,
  UnreadCount,
} from "../types"

export interface InboxParams {
  unreadOnly?: boolean
  offset?: number
  limit?: number
}

export type { SendNotificationPayload }

export default class NotificationServiceHelper {
  inboxAsync(params: InboxParams): UseApiCall<PagedResponse<NotificationItem>> {
    const controller = loadAbort()
    return {
      call: httpClient.get<PagedResponse<NotificationItem>>(
        NotificationUrl.Base,
        {
          signal: controller.signal,
          params: {
            unreadOnly: params.unreadOnly ?? false,
            offset: params.offset ?? 1,
            limit: params.limit ?? 20,
          },
        }
      ),
      controller,
    }
  }

  unreadCountAsync(): UseApiCall<UnreadCount> {
    const controller = loadAbort()
    return {
      call: httpClient.get<UnreadCount>(NotificationUrl.UnreadCount, {
        signal: controller.signal,
      }),
      controller,
    }
  }

  markReadAsync(id: string): UseApiCall<NotificationItem> {
    const controller = loadAbort()
    return {
      call: httpClient.post<NotificationItem>(NotificationUrl.Read(id), null, {
        signal: controller.signal,
      }),
      controller,
    }
  }

  markAllReadAsync(): UseApiCall<unknown> {
    const controller = loadAbort()
    return {
      call: httpClient.post<unknown>(NotificationUrl.ReadAll, null, {
        signal: controller.signal,
      }),
      controller,
    }
  }

  removeAsync(id: string): UseApiCall<void> {
    const controller = loadAbort()
    return {
      call: httpClient.delete<void>(NotificationUrl.ById(id), {
        signal: controller.signal,
      }),
      controller,
    }
  }

  sendAsync(payload: SendNotificationPayload): UseApiCall<NotificationItem> {
    const controller = loadAbort()
    return {
      call: httpClient.post<NotificationItem>(NotificationUrl.Base, payload, {
        signal: controller.signal,
      }),
      controller,
    }
  }
}
