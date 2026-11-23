"use client"

import { ProfilePage } from "@/features/badges/components/profile-badges"
import { ParamsRoute } from "@/features/shared/components/params-route"
import { ProfileSettings } from "@/features/skin/profile-settings"
import { LmsShell } from "@/features/shell/components/lms-shell"

export default function Page() {
  return (
    <LmsShell>
      <ParamsRoute required={[]} optional={["user"]}>
        {({ user }) => (
          <>
            <ProfilePage userId={user} />
            {user === null ? <ProfileSettings /> : null}
          </>
        )}
      </ParamsRoute>
    </LmsShell>
  )
}
