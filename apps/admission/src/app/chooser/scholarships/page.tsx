"use client"

import { RouteRedirect, type RedirectTarget } from "../../../components/route-redirect"

const target: RedirectTarget = () => ({ to: "/chooser/budget/?view=scholarships" })

export default function Page() {
  return <RouteRedirect target={target} />
}
