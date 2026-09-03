import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import {
  NotificationService,
  type InboxParams,
  type SendNotificationPayload,
} from "../services/notificationService"
import { useNotificationStreamStore } from "../store/streamStore"

export const notificationKeys = {
  all: ["notifications"] as const,
  unread: ["notifications", "unread-count"] as const,
  inbox: (p: InboxParams) => ["notifications", "inbox", p] as const,
}

/** What the badge falls back to when there is no live stream to be told by. */
const POLL_MS = 30_000

/**
 * The unread count behind the bell badge.
 *
 * <p>The poll is the floor, not the mechanism. With the stream up the server says when the count
 * changed, so the interval is dropped — but the poll itself does not go away, because the stream
 * is a latency optimisation and not a delivery guarantee. Emitters are held in memory on a single
 * instance: a redeploy drops every one of them and re-emits nothing. The table is the source of
 * truth, and this is how the badge finds its way back to it.
 *
 * <p>The stream state is read from the store rather than taken as an argument. Every caller shares
 * one query key, and react-query polls a key if any of its observers asks it to — so one screen
 * that did not know about the stream would keep the interval alive for all of them.
 */
export function useUnreadCount() {
  const streamConnected = useNotificationStreamStore((s) => s.connected)
  return useQuery({
    queryKey: notificationKeys.unread,
    queryFn: NotificationService.unreadCount,
    refetchInterval: streamConnected ? false : POLL_MS,
    refetchOnWindowFocus: true,
  })
}

export function useInbox(params: InboxParams, enabled = true) {
  return useQuery({
    queryKey: notificationKeys.inbox(params),
    queryFn: () => NotificationService.inbox(params),
    enabled,
  })
}

export function useMarkNotificationRead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => NotificationService.markRead(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: notificationKeys.all })
    },
  })
}

export function useSendNotification() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: SendNotificationPayload) =>
      NotificationService.send(payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: notificationKeys.all })
    },
  })
}

export function useMarkAllRead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => NotificationService.markAllRead(),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: notificationKeys.all })
    },
  })
}

export function useDeleteNotification() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => NotificationService.remove(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: notificationKeys.all })
    },
  })
}
