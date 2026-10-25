"use client"

import { ProfilePage } from "@/features/profile/components/profile-page"
import { SpShell } from "@/features/shell/components/sp-shell"

export default function Page() {
  return (
    <SpShell>
      <ProfilePage />
    </SpShell>
  )
}
