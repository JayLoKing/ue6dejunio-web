export interface NotificationItem {
  id: string
  senderId: string
  senderName: string
  receiverId: string
  receiverName: string
  message: string
  read: boolean
  createdAt: string
}

export interface UnreadCount {
  unread: number
}
