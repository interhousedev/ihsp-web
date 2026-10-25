"use client"

import { NotificationsPage } from "@/features/notifications/components/notifications-page"
import { SpShell } from "@/features/shell/components/sp-shell"

export default function Page() {
  return (
    <SpShell>
      <NotificationsPage />
    </SpShell>
  )
}
