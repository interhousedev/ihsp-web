"use client"

import { RouteRedirect, type RedirectTarget } from "../../../components/route-redirect"

/** `/activities/view/?id=X` -> `/activities/?item=X`; no id opens the new-item popup. */
const target: RedirectTarget = (params) => ({
  to: `/activities/?item=${encodeURIComponent(params.get("id") || "new")}`,
  drop: ["id"],
})

export default function Page() {
  return <RouteRedirect target={target} />
}
