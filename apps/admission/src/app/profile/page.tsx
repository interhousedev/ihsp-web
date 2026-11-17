"use client"

import { Suspense } from "react"
import { ProfilePage } from "../../features/profile/components/profile-page"

export default function Page() {
  return (
    <Suspense>
      <ProfilePage />
    </Suspense>
  )
}
