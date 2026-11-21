"use client"

import { useSearchParams } from "next/navigation"
import { Suspense } from "react"
import { RouteRedirect, type RedirectTarget } from "../../components/route-redirect"
import { ProfileHub } from "../../features/profile/components/profile-hub"

/** The old profile tabs (`details`, `background`) become the `section` of the settings tab. */
const target: RedirectTarget = (params) => {
  const tab = params.get("tab")
  const section = tab === "details" || tab === "background" ? `&section=${tab}` : ""
  return { to: `/settings/?tab=profile${section}`, drop: ["tab"] }
}

function Switch() {
  const tab = useSearchParams().get("tab")
  return tab === "details" || tab === "background" ? <RouteRedirect target={target} /> : <ProfileHub />
}

export default function Page() {
  return (
    <Suspense>
      <Switch />
    </Suspense>
  )
}
