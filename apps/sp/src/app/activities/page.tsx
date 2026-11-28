"use client"

import { FeedPage } from "@/features/activities/components/feed-page"
import { SpShell } from "@/features/shell/components/sp-shell"
export default function FeedPageRoute() {
  return (
    <SpShell>
      <FeedPage />
    </SpShell>
  )
}
