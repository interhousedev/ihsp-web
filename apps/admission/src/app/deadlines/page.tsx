"use client"

import { RouteRedirect, type RedirectTarget } from "../../components/route-redirect"

// Deadlines became the timeline view of the tasks page.
const target: RedirectTarget = () => ({ to: "/tasks/?view=gantt" })

export default function Page() {
  return <RouteRedirect target={target} />
}
