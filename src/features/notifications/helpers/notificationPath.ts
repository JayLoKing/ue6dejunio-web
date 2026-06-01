const baseModuleUrl = "/notifications"

export const NotificationUrl = {
  Base: baseModuleUrl,
  UnreadCount: `${baseModuleUrl}/unread-count`,
  Read: (id: string) => `${baseModuleUrl}/${id}/read`,
  ReadAll: `${baseModuleUrl}/read-all`,
  ById: (id: string) => `${baseModuleUrl}/${id}`,
} as const
