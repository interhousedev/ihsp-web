"use client"

import { RouteRedirect, type RedirectTarget } from "../../../components/route-redirect"

const target: RedirectTarget = () => ({ to: "/plan/?view=saved" })

export default function Page() {
  return <RouteRedirect target={target} />
}
