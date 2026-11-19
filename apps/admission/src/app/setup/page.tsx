"use client"

import { useSearchParams } from "next/navigation"
import { Suspense } from "react"
import { RouteRedirect, type RedirectTarget } from "../../components/route-redirect"
import { SetupWizard } from "../../features/profile/components/setup-wizard"

/** Questions that now live in a section page open there; every other `?q=` stays in the first-run wizard. */
const MOVED: Record<string, string> = {
  q18: "/career/?tab=field",
  q24: "/chooser/search/?prefs=1",
  q05: "/settings/?tab=profile",
}

const target: RedirectTarget = (params) => ({ to: MOVED[params.get("q") ?? ""], drop: ["q"] })

function SetupRoute() {
  const q = useSearchParams().get("q")
  if (q && Object.hasOwn(MOVED, q)) return <RouteRedirect target={target} />
  return <SetupWizard />
}

export default function Page() {
  return (
    <Suspense>
      <SetupRoute />
    </Suspense>
  )
}
