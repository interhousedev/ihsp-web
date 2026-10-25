"use client"

import { NotificationsPage } from "@/features/notifications/components/notifications-page"
import { StaffShell } from "@/features/shell/components/staff-shell"

export default function Page() {
  return (
    <StaffShell>
      <NotificationsPage />
    </StaffShell>
  )
}
