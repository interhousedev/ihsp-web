// Notifications (backend § API contract → "Notifications and broadcasts (B8)" and Schemas).

import type { PageParams } from "./common"

export type NotificationItem = {
  id: string
  type: string
  title: string
  body: string
  link: string | null
  created_at: string
  read_at: string | null
}

export type NotificationFilter = "all" | "activity" | "announcements"
export type NotificationsParams = PageParams & { filter?: NotificationFilter }
export type UnreadCount = { count: number }
