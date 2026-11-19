"use client"

import { RouteRedirect, type RedirectTarget } from "../../components/route-redirect"

/** The old profile tabs (`details`, `background`) become the `section` of the settings tab. */
const target: RedirectTarget = (params) => {
  const tab = params.get("tab")
  const section = tab === "details" || tab === "background" ? `&section=${tab}` : ""
  return { to: `/settings/?tab=profile${section}`, drop: ["tab"] }
}

export default function Page() {
  return <RouteRedirect target={target} />
}
