import type { UseApiCall } from "@/lib/useApicall"
import { loadAbort } from "@/lib/loadAbort"
import { httpClient } from "@/lib/axios"
import { env } from "@/config/env"
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

  /**
   * Opens the live stream. The one call in this module that does not go through axios.
   *
   * <p>An `XMLHttpRequest` hands the body over as one string when it finishes, and this response
   * never finishes — `fetch` is what exposes it as a stream while it is still arriving. The
   * cancellation still comes from outside, the same way the abort controller works everywhere else
   * here, but it is the caller's: this connection outlives any one request.
   *
   * <p>The header is built by hand because the axios interceptor is not on this path. It is the
   * same `Bearer` and the same base URL, assembled at the same edge as the rest.
   */
  streamAsync(token: string, signal: AbortSignal): Promise<Response> {
    return fetch(`${env.VITE_API_URL}${NotificationUrl.Stream}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "text/event-stream",
      },
      signal,
    })
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
