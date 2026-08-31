import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import {
  NotificationService,
  type InboxParams,
  type SendNotificationPayload,
} from "../services/notificationService"

export const notificationKeys = {
  all: ["notifications"] as const,
  unread: ["notifications", "unread-count"] as const,
  inbox: (p: InboxParams) => ["notifications", "inbox", p] as const,
}

/** Polls unread count every 30s for the bell badge. */
export function useUnreadCount() {
  return useQuery({
    queryKey: notificationKeys.unread,
    queryFn: NotificationService.unreadCount,
    refetchInterval: 30_000,
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
