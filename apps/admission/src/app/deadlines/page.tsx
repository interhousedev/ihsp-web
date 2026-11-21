"use client"

import { RouteRedirect, type RedirectTarget } from "../../components/route-redirect"

// Deadlines became the default view of the tasks page.
const target: RedirectTarget = () => ({ to: "/tasks/" })

export default function Page() {
  return <RouteRedirect target={target} />
}
